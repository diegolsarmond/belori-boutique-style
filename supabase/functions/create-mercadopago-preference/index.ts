// @ts-nocheck
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    // Check database settings
    const { data: paymentSettings, error: paymentSettingsError } = await supabase
      .from('BeloriBH_payment_settings')
      .select('access_token, is_active')
      .eq('provider', 'mercadopago')
      .maybeSingle();

    if (!paymentSettingsError && paymentSettings?.is_active && paymentSettings?.access_token) {
      console.log('Using Mercado Pago Access Token from database');
      accessToken = paymentSettings.access_token;
    }

    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { items, customer, backUrls, orderNumber } = await req.json() as {
      items: CartItem[];
      customer: CustomerInfo;
      orderNumber?: string;
      backUrls?: {
        success?: string;
        failure?: string;
        pending?: string;
      };
    };

    console.log('Creating preference for items:', items);
    console.log('Customer:', customer);
    console.log('Order Number:', orderNumber);

    // Validate if orderNumber is provided (new flow)
    if (!orderNumber) {
      throw new Error('Número do pedido não fornecido');
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
          area_code: customer.phone.replace(/\D/g, '').substring(0, 2),
          number: customer.phone.replace(/\D/g, '').substring(2),
        } : undefined,
        address: customer.address ? {
          street_name: customer.address,
          zip_code: customer.postalCode?.replace(/\D/g, '') || '',
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
