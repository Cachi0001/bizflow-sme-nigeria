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

    const { userId, amount } = await req.json();

    if (!userId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has sufficient referral earnings
    const { data: earningsData, error: earningsError } = await supabaseClient
      .from('referral_earnings')
      .select('amount')
      .eq('referrer_id', userId);

    if (earningsError) throw earningsError;

    const totalEarnings = earningsData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

    if (totalEarnings < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient referral earnings' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply 15% fee
    const fee = amount * 0.15;
    const netAmount = amount - fee;

    // Record withdrawal request
    const { error: withdrawalError } = await supabaseClient
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount: amount,
        fee: fee,
        net_amount: netAmount,
        status: 'pending',
      });

    if (withdrawalError) throw withdrawalError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Withdrawal request for ₦${amount.toLocaleString()} submitted. Net amount: ₦${netAmount.toLocaleString()}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal Server Error',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


