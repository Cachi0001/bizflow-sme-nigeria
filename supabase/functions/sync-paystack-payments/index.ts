
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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not found in environment variables');
    }

    // Fetch recent transactions from Paystack (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction?status=success&from=${yesterday.toISOString().split('T')[0]}&channel=pos`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackResponse.ok) {
      throw new Error(`Paystack API error: ${paystackResponse.statusText}`);
    }

    const paystackData = await paystackResponse.json();
    const transactions = paystackData.data || [];

    let insertedCount = 0;

    for (const transaction of transactions) {
      // Check if transaction already exists
      const { data: existingPayment } = await supabaseClient
        .from('payments')
        .select('id')
        .eq('transaction_id', transaction.reference)
        .single();

      if (!existingPayment) {
        // Get user by email (you might need to adjust this logic based on your user matching strategy)
        const { data: user } = await supabaseClient
          .from('users')
          .select('id')
          .eq('email', transaction.customer?.email)
          .single();

        if (user) {
          // Insert new payment record
          const { error } = await supabaseClient
            .from('payments')
            .insert({
              user_id: user.id,
              date: new Date(transaction.paid_at).toISOString().split('T')[0],
              description: `POS Transaction - ${transaction.channel}`,
              customer_name: transaction.customer?.email || 'Unknown Customer',
              amount: transaction.amount / 100, // Paystack amounts are in kobo
              transaction_id: transaction.reference,
              payment_method: 'POS',
              auto_recorded: true,
            });

          if (!error) {
            insertedCount++;
          } else {
            console.error('Error inserting payment:', error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${transactions.length} transactions, inserted ${insertedCount} new payments`,
        insertedCount,
        totalTransactions: transactions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error syncing Paystack payments:', error);
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
