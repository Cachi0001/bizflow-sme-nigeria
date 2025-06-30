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

    const { userId, subscriptionTier, amount } = await req.json()
    
    console.log('Processing referral upgrade:', { userId, subscriptionTier, amount })

    // Find if this user was referred by someone
    const { data: referralData, error: referralError } = await supabaseClient
      .from('referrals')
      .select(`
        referrer_id,
        users!referrals_referrer_id_fkey(email, business_name)
      `)
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single()

    if (referralError || !referralData) {
      console.log('No pending referral found for user:', userId)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No referral to process' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Calculate referral earning (10% of the subscription amount)
    const referralEarning = Math.round(amount * 0.10)

    console.log('Calculated referral earning:', referralEarning)

    // Create referral earning record
    const { error: earningError } = await supabaseClient
      .from('referral_earnings')
      .insert({
        referrer_id: referralData.referrer_id,
        referred_id: userId,
        amount: referralEarning,
        subscription_tier: subscriptionTier,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (earningError) {
      console.error('Error creating referral earning:', earningError)
      throw earningError
    }

    // Update referral status to completed
    const { error: updateError } = await supabaseClient
      .from('referrals')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('referred_id', userId)
      .eq('referrer_id', referralData.referrer_id)

    if (updateError) {
      console.error('Error updating referral status:', updateError)
      throw updateError
    }

    console.log('Referral earning processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral earning processed successfully',
        earning_amount: referralEarning,
        referrer_id: referralData.referrer_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in process-referral-upgrade function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process referral upgrade'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

