import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_DOMAIN");
const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_id, title, body, vendor, product_type, tags, images } = await req.json();

    const shopifyResponse = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/products/${product_id}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
        },
        body: JSON.stringify({
          product: {
            id: product_id,
            title,
            body_html: body,
            vendor,
            product_type,
            tags,
            images: images?.map((img: any) => ({
              src: img.file_path,
              alt: img.alt || title,
            })) || [],
          },
        }),
      }
    );

    const data = await shopifyResponse.json();

    if (!shopifyResponse.ok) {
      throw new Error(data.errors || "Erro ao atualizar produto no Shopify");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
