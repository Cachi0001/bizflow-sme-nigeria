import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { referrerId, referredId, planType, upgradeAmount } = await req.json();

    console.log('Processing referral payment:', { referrerId, referredId, planType, upgradeAmount });

    let earningAmount = 0;
    if (planType === 'Monthly') {
      earningAmount = 500; // ₦500 for monthly Silver
    }

    if (earningAmount === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No referral reward for this plan type.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create referral earning record
    const { error: earningError } = await supabaseClient
      .from('referral_earnings')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        amount: earningAmount,
        status: 'pending'
      });

    if (earningError) {
      console.error('Error creating referral earning:', earningError);
      throw new Error('Failed to create referral earning');
    }

    return new Response(
      JSON.stringify({
        success: true,
        earningAmount,
        message: `Referral earning of ₦${earningAmount.toFixed(2)} has been credited`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-referral-payment:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


