import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { items, customer, backUrls } = await req.json() as {
      items: CartItem[];
      customer: CustomerInfo;
      backUrls?: {
        success?: string;
        failure?: string;
        pending?: string;
      };
    };

    console.log('Creating preference for items:', items);
    console.log('Customer:', customer);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      throw new Error('Erro ao gerar número do pedido');
    }

    const orderNumber = orderNumberData;
    console.log('Generated order number:', orderNumber);

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create or find customer
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: customer.email,
          full_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.postalCode,
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
      } else {
        customerId = newCustomer?.id || null;
      }
    }

    // Create order in database with pending status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customer.name,
        customer_email: customer.email,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: 'mercadopago',
        shipping_address: customer.address ? 
          `${customer.address}, ${customer.city} - ${customer.state}, ${customer.postalCode}` : null,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Erro ao criar pedido');
    }

    console.log('Created order:', order);

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_title: item.name,
      variant_id: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }

    // Build Mercado Pago preference
    const preference = {
      items: items.map(item => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: 'BRL',
        picture_url: item.imageUrl || undefined,
      })),
      payer: {
        name: customer.name.split(' ')[0],
        surname: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: customer.phone ? {
          area_code: customer.phone.substring(0, 2),
          number: customer.phone.substring(2),
        } : undefined,
        address: customer.address ? {
          street_name: customer.address,
          zip_code: customer.postalCode || '',
        } : undefined,
      },
      back_urls: {
        success: backUrls?.success || `${req.headers.get('origin')}/checkout/sucesso?order=${orderNumber}`,
        failure: backUrls?.failure || `${req.headers.get('origin')}/checkout/falha?order=${orderNumber}`,
        pending: backUrls?.pending || `${req.headers.get('origin')}/checkout/pendente?order=${orderNumber}`,
      },
      auto_return: 'approved',
      external_reference: orderNumber,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'BELORI',
    };

    console.log('Creating MP preference:', JSON.stringify(preference, null, 2));

    // Call Mercado Pago API
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago API error:', mpData);
      throw new Error(mpData.message || 'Erro ao criar preferência no Mercado Pago');
    }

    console.log('Mercado Pago preference created:', mpData.id);

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        orderNumber,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-mercadopago-preference:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
