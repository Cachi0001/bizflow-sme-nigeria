import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    
    console.log('Processing new user:', record.id)

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    // Create user record in users table with 7-day trial
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: record.id,
        email: record.email,
        phone: record.raw_user_meta_data?.phone || '',
        business_name: record.raw_user_meta_data?.business_name || '',
        role: record.raw_user_meta_data?.role || 'Owner',
        subscription_tier: 'Weekly', // Start with Weekly tier for 7-day trial
        trial_end_date: trialEndDate.toISOString(),
        is_trial: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      throw userError
    }

    console.log('User record created successfully:', userData)

    // Handle referral if referral code was provided
    const referralCode = record.raw_user_meta_data?.referral_code
    if (referralCode) {
      console.log('Processing referral for code:', referralCode)
      
      // Find the referrer by their referral code
      const { data: referrer, error: referrerError } = await supabaseClient
        .from('users')
        .select('id, email, business_name')
        .eq('referral_code', referralCode)
        .single()

      if (referrer && !referrerError) {
        // Create referral record
        const { error: referralError } = await supabaseClient
          .from('referrals')
          .insert({
            referrer_id: referrer.id,
            referred_id: record.id,
            status: 'pending',
            created_at: new Date().toISOString()
          })

        if (referralError) {
          console.error('Error creating referral record:', referralError)
        } else {
          console.log('Referral record created successfully')
        }
      } else {
        console.log('Referrer not found for code:', referralCode)
      }
    }

    // Generate unique referral code for the new user
    const generateReferralCode = () => {
      const businessName = record.raw_user_meta_data?.business_name || 'USER'
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `${businessName.substring(0, 3).toUpperCase()}${randomSuffix}`
    }

    const newReferralCode = generateReferralCode()

    // Update user with referral code
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ 
        referral_code: newReferralCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id)

    if (updateError) {
      console.error('Error updating user with referral code:', updateError)
    } else {
      console.log('User updated with referral code:', newReferralCode)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User processed successfully with 7-day trial',
        trial_end_date: trialEndDate.toISOString(),
        referral_code: newReferralCode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in handle-new-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process new user registration'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

