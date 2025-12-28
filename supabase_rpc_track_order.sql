-- =====================================================
-- PARTE 1: ADICIONAR COLUNAS À TABELA DE PEDIDOS
-- Execute este SQL primeiro no Supabase SQL Editor
-- =====================================================

-- Adicionar colunas de rastreio e datas
ALTER TABLE "BeloriBH_orders" 
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- =====================================================
-- PARTE 2: FUNÇÕES RPC PARA RASTREAMENTO PÚBLICO
-- =====================================================

-- Função para buscar pedido por número (acesso público)
CREATE OR REPLACE FUNCTION public.track_order_by_number(p_order_number TEXT)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  status TEXT,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ,
  tracking_code TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    -- Mascarar email para privacidade
    LEFT(o.customer_email, 2) || '***' || SUBSTRING(o.customer_email FROM POSITION('@' IN o.customer_email)) as customer_email,
    o.status,
    o.total_amount,
    o.created_at,
    o.tracking_code,
    o.tracking_url,
    o.shipped_at,
    o.delivered_at
  FROM "BeloriBH_orders" o
  WHERE UPPER(o.order_number) = UPPER(p_order_number);
END;
$$;

-- Função para buscar pedidos por email
CREATE OR REPLACE FUNCTION public.track_orders_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  status TEXT,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ,
  tracking_code TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    -- Mascarar email para privacidade
    LEFT(o.customer_email, 2) || '***' || SUBSTRING(o.customer_email FROM POSITION('@' IN o.customer_email)) as customer_email,
    o.status,
    o.total_amount,
    o.created_at,
    o.tracking_code,
    o.tracking_url,
    o.shipped_at,
    o.delivered_at
  FROM "BeloriBH_orders" o
  WHERE LOWER(o.customer_email) = LOWER(p_email)
  ORDER BY o.created_at DESC;
END;
$$;

-- Função para buscar itens de um pedido
CREATE OR REPLACE FUNCTION public.get_order_items_public(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  product_title TEXT,
  variant_title TEXT,
  quantity INTEGER,
  price NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.id,
    oi.product_title,
    oi.variant_title,
    oi.quantity,
    oi.price
  FROM "BeloriBH_order_items" oi
  WHERE oi.order_id = p_order_id;
END;
$$;

-- =====================================================
-- PARTE 3: PERMISSÕES
-- =====================================================

-- Conceder permissão para usuários anônimos usarem as funções
GRANT EXECUTE ON FUNCTION public.track_order_by_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.track_orders_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_items_public(UUID) TO anon;

-- Também para usuários autenticados
GRANT EXECUTE ON FUNCTION public.track_order_by_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_orders_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_items_public(UUID) TO authenticated;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Após executar, a página de acompanhamento de pedidos
-- funcionará sem necessidade de login.
