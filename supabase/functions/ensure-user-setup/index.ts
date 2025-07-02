import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a regular client for user verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Setting up user:', user.id)

    // Check if user exists in users table using admin client
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking user:', checkError)
    }

    let userData = existingUser

    // If user doesn't exist in users table, create them
    if (!existingUser) {
      console.log('Creating missing user record for:', user.id)
      
      // Generate referral code
      const referralCode = `BF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Set trial end date (7 days from now)
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7)

      const newUserData = {
        id: user.id,
        email: user.email,
        phone: user.user_metadata?.phone || '',
        role: 'Owner',
        subscription_tier: 'Free', // Start with Free, trial gives access to Weekly features
        business_name: user.user_metadata?.business_name || 'My Business',
        is_trial: true,
        trial_end_date: trialEndDate.toISOString(),
        referral_code: referralCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(newUserData)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user record:', insertError)
        throw insertError
      }

      userData = insertedUser
    } else if (!existingUser.is_trial && !existingUser.trial_end_date) {
      // If user exists but doesn't have trial data, update them
      console.log('Updating existing user with trial data:', user.id)
      
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7)

      const updateData: any = {
        is_trial: true,
        trial_end_date: trialEndDate.toISOString(),
        subscription_tier: 'Free', // Start with Free, trial gives access to Weekly features
        updated_at: new Date().toISOString()
      }

      // Add referral code if missing
      if (!existingUser.referral_code) {
        updateData.referral_code = `BF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user record:', updateError)
        throw updateError
      }

      userData = updatedUser
    }

    // Also ensure subscriptions table has a record if needed
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription && !subError) {
      // Create a subscription record
      const { error: createSubError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: userData?.subscription_tier || 'Free',
          status: userData?.is_trial ? 'trial' : 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createSubError) {
        console.log('Note: Could not create subscription record:', createSubError)
        // Don't fail the request for this
      }
    }

    // Calculate days left in trial
    let daysLeft = 0
    if (userData?.is_trial && userData?.trial_end_date) {
      const endDate = new Date(userData.trial_end_date)
      const now = new Date()
      const diffTime = endDate.getTime() - now.getTime()
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        trial_info: {
          is_trial: userData?.is_trial || false,
          trial_end_date: userData?.trial_end_date || null,
          days_left: daysLeft,
          subscription_tier: userData?.subscription_tier || 'Free'
        },
        message: 'User setup completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in ensure-user-setup function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

