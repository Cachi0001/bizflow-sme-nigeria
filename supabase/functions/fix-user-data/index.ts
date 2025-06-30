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

    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, is_trial, trial_end_date, referral_code')
      .eq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError)
      throw checkError
    }

    // If user doesn't exist in users table, create them
    if (!existingUser) {
      console.log('Creating missing user record for:', user.id)
      
      // Generate referral code
      const referralCode = `BF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Set trial end date (7 days from now)
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7)

      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          phone: user.user_metadata?.phone || null,
          role: 'Owner',
          subscription_tier: 'Weekly',
          business_name: user.user_metadata?.business_name || 'My Business',
          is_trial: true,
          trial_end_date: trialEndDate.toISOString(),
          referral_code: referralCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating user record:', insertError)
        throw insertError
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User data created successfully',
          trial_activated: true,
          trial_end_date: trialEndDate.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // If user exists but doesn't have trial data, update them
    if (existingUser && !existingUser.is_trial) {
      console.log('Updating existing user with trial data:', user.id)
      
      // Set trial end date (7 days from now)
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7)

      const updateData: any = {
        is_trial: true,
        trial_end_date: trialEndDate.toISOString(),
        subscription_tier: 'Weekly',
        updated_at: new Date().toISOString()
      }

      // Add referral code if missing
      if (!existingUser.referral_code) {
        updateData.referral_code = `BF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user record:', updateError)
        throw updateError
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User trial activated successfully',
          trial_activated: true,
          trial_end_date: trialEndDate.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // User already has trial data
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User data is already properly configured',
        trial_activated: existingUser.is_trial,
        trial_end_date: existingUser.trial_end_date
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in fix-user-data function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

