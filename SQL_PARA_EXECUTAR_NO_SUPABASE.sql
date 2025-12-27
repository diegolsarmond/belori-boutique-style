-- EXECUTAR ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Este script atualiza o banco de dados para usar os novos nomes de tabela (BeloriBH_)
-- e adiciona as colunas que estavam faltando.

-- 1. Renomear tabelas (se existirem com o nome antigo)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles RENAME TO "BeloriBH_profiles";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        ALTER TABLE public.user_roles RENAME TO "BeloriBH_user_roles";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        ALTER TABLE public.customers RENAME TO "BeloriBH_customers";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        ALTER TABLE public.orders RENAME TO "BeloriBH_orders";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        ALTER TABLE public.order_items RENAME TO "BeloriBH_order_items";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slides') THEN
        ALTER TABLE public.slides RENAME TO "BeloriBH_slides";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        ALTER TABLE public.suppliers RENAME TO "BeloriBH_suppliers";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        ALTER TABLE public.products RENAME TO "BeloriBH_products";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_settings') THEN
        ALTER TABLE public.site_settings RENAME TO "BeloriBH_site_settings";
    END IF;
END $$;

-- 2. Adicionar colunas novas à tabela de produtos (agora BeloriBH_products)
-- Verifica se as colunas já existem antes de tentar adicionar para evitar erros
DO $$
BEGIN
    -- category
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'BeloriBH_products' AND column_name = 'category') THEN
        ALTER TABLE public."BeloriBH_products" ADD COLUMN category TEXT;
    END IF;
    
    -- additional_images
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'BeloriBH_products' AND column_name = 'additional_images') THEN
        ALTER TABLE public."BeloriBH_products" ADD COLUMN additional_images TEXT[];
    END IF;

    -- colors
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'BeloriBH_products' AND column_name = 'colors') THEN
        ALTER TABLE public."BeloriBH_products" ADD COLUMN colors TEXT[];
    END IF;

    -- sizes
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'BeloriBH_products' AND column_name = 'sizes') THEN
        ALTER TABLE public."BeloriBH_products" ADD COLUMN sizes TEXT[];
    END IF;
END $$;

-- 3. Atualizar/Recriar Triggers para apontar para as tabelas renomeadas
-- (Caso os triggers antigos tenham sido removidos ou invalidado com o rename)

-- Remover triggers antigos se ainda existirem (nomes padrão)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public."BeloriBH_profiles";
DROP TRIGGER IF EXISTS update_customers_updated_at ON public."BeloriBH_customers";
DROP TRIGGER IF EXISTS update_orders_updated_at ON public."BeloriBH_orders";
DROP TRIGGER IF EXISTS update_slides_updated_at ON public."BeloriBH_slides";
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public."BeloriBH_suppliers";
DROP TRIGGER IF EXISTS update_products_updated_at ON public."BeloriBH_products";
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public."BeloriBH_site_settings";

-- Garantir que a função update_updated_at_column existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Criar triggers com novos nomes (se não existirem)
DROP TRIGGER IF EXISTS update_beloribh_profiles_updated_at ON public."BeloriBH_profiles";
CREATE TRIGGER update_beloribh_profiles_updated_at
  BEFORE UPDATE ON public."BeloriBH_profiles"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_customers_updated_at ON public."BeloriBH_customers";
CREATE TRIGGER update_beloribh_customers_updated_at
  BEFORE UPDATE ON public."BeloriBH_customers"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_orders_updated_at ON public."BeloriBH_orders";
CREATE TRIGGER update_beloribh_orders_updated_at
  BEFORE UPDATE ON public."BeloriBH_orders"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_slides_updated_at ON public."BeloriBH_slides";
CREATE TRIGGER update_beloribh_slides_updated_at
  BEFORE UPDATE ON public."BeloriBH_slides"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_suppliers_updated_at ON public."BeloriBH_suppliers";
CREATE TRIGGER update_beloribh_suppliers_updated_at
  BEFORE UPDATE ON public."BeloriBH_suppliers"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_products_updated_at ON public."BeloriBH_products";
CREATE TRIGGER update_beloribh_products_updated_at
  BEFORE UPDATE ON public."BeloriBH_products"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_beloribh_site_settings_updated_at ON public."BeloriBH_site_settings";
CREATE TRIGGER update_beloribh_site_settings_updated_at
  BEFORE UPDATE ON public."BeloriBH_site_settings"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Atualizar funções que usam Hardcoded table names (ex: has_role, handle_new_user, generate_order_number)

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."BeloriBH_user_roles"
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."BeloriBH_profiles" (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_number := 'BEL-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public."BeloriBH_orders" WHERE order_number = new_number) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_number;
END;
$$;
