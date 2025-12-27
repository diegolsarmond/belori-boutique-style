// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    // Parse the webhook payload
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Mercado Pago sends different types of notifications
    const { type, data, action } = body;

    // Handle IPN (Instant Payment Notification)
    if (type === 'payment' && data?.id) {
      const paymentId = data.id;
      console.log('Processing payment:', paymentId);

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment details');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      const externalReference = payment.external_reference;
      const status = payment.status;

      if (externalReference) {
        // Map Mercado Pago status to our status
        let orderStatus = 'pending';
        switch (status) {
          case 'approved':
            orderStatus = 'paid';
            break;
          case 'pending':
          case 'in_process':
            orderStatus = 'pending';
            break;
          case 'rejected':
          case 'cancelled':
            orderStatus = 'cancelled';
            break;
          case 'refunded':
            orderStatus = 'refunded';
            break;
        }

        console.log(`Updating order ${externalReference} to status ${orderStatus}`);

        // Update order status
        const { error: updateError } = await supabase
          .from('BeloriBH_orders')
          .update({
            status: orderStatus,
            notes: `Payment ID: ${paymentId}, Status: ${status}`,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', externalReference);

        if (updateError) {
          console.error('Error updating order:', updateError);
        } else {
          console.log('Order updated successfully');
        }

        // If payment approved, update product stock
        if (orderStatus === 'paid') {
          const { data: order } = await supabase
            .from('BeloriBH_orders')
            .select('id')
            .eq('order_number', externalReference)
            .single();

          if (order) {
            const { data: orderItems } = await supabase
              .from('BeloriBH_order_items')
              .select('product_id, quantity')
              .eq('order_id', order.id);

            if (orderItems) {
              for (const item of orderItems) {
                // Decrement stock
                const { data: product } = await supabase
                  .from('BeloriBH_products')
                  .select('stock_quantity')
                  .eq('id', item.product_id)
                  .single();

                if (product) {
                  const newStock = Math.max(0, product.stock_quantity - item.quantity);
                  await supabase
                    .from('BeloriBH_products')
                    .update({ stock_quantity: newStock })
                    .eq('id', item.product_id);

                  console.log(`Updated stock for product ${item.product_id}: ${product.stock_quantity} -> ${newStock}`);
                }
              }
            }
          }
        }
      }
    }

    // Handle merchant_order notifications
    if (type === 'merchant_order' && data?.id) {
      console.log('Merchant order notification:', data.id);
      // These can be ignored or processed if needed
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to avoid Mercado Pago retries
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
