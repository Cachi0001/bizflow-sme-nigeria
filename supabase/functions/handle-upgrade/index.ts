
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

    const { currentPlan, newPlan, userId } = await req.json();

    console.log('Processing upgrade:', { currentPlan, newPlan, userId });

    // Get current subscription details
    const { data: currentSubscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Active')
      .single();

    if (subError) {
      console.error('Error fetching current subscription:', subError);
      throw new Error('Current subscription not found');
    }

    // Calculate pro-rata credit
    let proRataCredit = 0;
    const now = new Date();
    const endDate = new Date(currentSubscription.end_date);
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Plan pricing (in kobo for Paystack)
    const planPrices = {
      'Free': 0,
      'Weekly': 140000, // ₦1,400
      'Monthly': 450000, // ₦4,500
      'Yearly': 5000000 // ₦50,000
    };

    // Calculate daily rate of current plan
    let dailyRate = 0;
    if (currentPlan === 'Weekly') {
      dailyRate = planPrices.Weekly / 7;
    } else if (currentPlan === 'Monthly') {
      dailyRate = planPrices.Monthly / 30;
    } else if (currentPlan === 'Yearly') {
      dailyRate = planPrices.Yearly / 365;
    }

    proRataCredit = Math.floor(dailyRate * remainingDays);

    console.log('Pro-rata calculation:', {
      remainingDays,
      dailyRate,
      proRataCredit
    });

    // Calculate new plan cost after credit
    const newPlanCost = planPrices[newPlan] || 0;
    const finalAmount = Math.max(0, newPlanCost - proRataCredit);

    // Update current subscription to expired
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'Expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id);

    if (updateError) {
      console.error('Error updating current subscription:', updateError);
      throw new Error('Failed to update current subscription');
    }

    // Calculate new end date
    let newEndDate = new Date();
    if (newPlan === 'Weekly') {
      newEndDate.setDate(newEndDate.getDate() + 7);
    } else if (newPlan === 'Monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (newPlan === 'Yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Create new subscription
    const { error: createError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: newPlan,
        status: 'Active',
        start_date: new Date().toISOString(),
        end_date: newEndDate.toISOString(),
        created_at: new Date().toISOString()
      });

    if (createError) {
      console.error('Error creating new subscription:', createError);
      throw new Error('Failed to create new subscription');
    }

    // Update user's subscription tier
    const { error: userUpdateError } = await supabaseClient
      .from('users')
      .update({
        subscription_tier: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user subscription tier:', userUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        proRataCredit: proRataCredit / 100, // Convert back to naira
        originalAmount: newPlanCost / 100,
        finalAmount: finalAmount / 100,
        remainingDays,
        message: `Upgrade successful! You received ₦${(proRataCredit / 100).toFixed(2)} pro-rata credit.`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in handle-upgrade:', error);
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
