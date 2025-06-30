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

    const { currentPlan, newPlan, userId, userEmail } = await req.json();

    console.log('Processing upgrade:', { currentPlan, newPlan, userId, userEmail });

    // Get current subscription details
    const { data: currentSubscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Active')
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching current subscription:', subError);
      throw new Error('Failed to fetch current subscription');
    }

    // Plan pricing (in kobo for Paystack)
    const planPrices: { [key: string]: number } = {
      'Free': 0,
      'Weekly': 140000, // ₦1,400
      'Monthly': 450000, // ₦4,500
      'Yearly': 5000000 // ₦50,000
    };

    let proRataCredit = 0;
    if (currentSubscription) {
      const now = new Date();
      const endDate = new Date(currentSubscription.end_date);
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      let dailyRate = 0;
      if (currentPlan === 'Weekly') {
        dailyRate = planPrices.Weekly / 7;
      } else if (currentPlan === 'Monthly') {
        dailyRate = planPrices.Monthly / 30;
      } else if (currentPlan === 'Yearly') {
        dailyRate = planPrices.Yearly / 365;
      }
      proRataCredit = Math.floor(dailyRate * remainingDays);
    }

    const newPlanCost = planPrices[newPlan] || 0;
    const finalAmount = Math.max(0, newPlanCost - proRataCredit);

    if (finalAmount <= 0) {
      // If amount is 0 or negative, directly upgrade without Paystack
      if (currentSubscription) {
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'Expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);
      }

      let newEndDate = new Date();
      if (newPlan === 'Weekly') {
        newEndDate.setDate(newEndDate.getDate() + 7);
      } else if (newPlan === 'Monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (newPlan === 'Yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: newPlan,
          status: 'Active',
          start_date: new Date().toISOString(),
          end_date: newEndDate.toISOString(),
          created_at: new Date().toISOString()
        });

      await supabaseClient
        .from('users')
        .update({
          subscription_tier: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Process referral earnings if applicable (for free upgrades)
      try {
        const { error: referralError } = await supabaseClient.functions.invoke('process-referral-upgrade', {
          body: { 
            userId: userId, 
            subscriptionTier: newPlan,
            amount: finalAmount / 100 // Convert from kobo to naira
          }
        })
        
        if (referralError) {
          console.error('Error processing referral:', referralError)
          // Don't fail the upgrade if referral processing fails
        } else {
          console.log('Referral processing completed successfully')
        }
      } catch (referralError) {
        console.error('Error calling referral function:', referralError)
        // Don't fail the upgrade if referral processing fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Upgrade successful (no payment required).',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initiate Paystack transaction
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not found in environment variables');
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail, // User's email for Paystack
        amount: finalAmount, // in kobo
        callback_url: Deno.env.get('PAYSTACK_CALLBACK_URL') ?? 'http://localhost:3000/dashboard', // Redirect after payment
        metadata: {
          userId: userId,
          newPlan: newPlan,
          currentPlan: currentPlan,
          proRataCredit: proRataCredit,
        },
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error('Paystack initialization error:', errorData);
      throw new Error(`Paystack initialization failed: ${errorData.message || paystackResponse.statusText}`);
    }

    const paystackData = await paystackResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: paystackData.data.authorization_url,
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


