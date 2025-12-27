-- Criação do sistema de autenticação e controle de acesso

-- 1. Tabela de perfis
CREATE TABLE public."BeloriBH_profiles" (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public."BeloriBH_profiles" ENABLE ROW LEVEL SECURITY;

-- 2. Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 3. Tabela de roles de usuários (SEPARADA para segurança)
CREATE TABLE public."BeloriBH_user_roles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public."BeloriBH_user_roles" ENABLE ROW LEVEL SECURITY;

-- 4. Function security definer para checar roles (CRÍTICO PARA SEGURANÇA)
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

-- 5. Tabela de clientes (informações de clientes da loja)
CREATE TABLE public."BeloriBH_customers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'BR',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public."BeloriBH_customers" ENABLE ROW LEVEL SECURITY;

-- 6. Tabela de pedidos
CREATE TABLE public."BeloriBH_orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public."BeloriBH_customers"(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  shipping_address TEXT,
  notes TEXT,
  shopify_order_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public."BeloriBH_orders" ENABLE ROW LEVEL SECURITY;

-- 7. Tabela de itens do pedido
CREATE TABLE public."BeloriBH_order_items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public."BeloriBH_orders"(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  variant_title TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public."BeloriBH_order_items" ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Usuários podem ver e atualizar seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public."BeloriBH_profiles" FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public."BeloriBH_profiles" FOR UPDATE
  USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public."BeloriBH_profiles" FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User Roles: Apenas admins podem gerenciar roles
CREATE POLICY "Admins can view all roles"
  ON public."BeloriBH_user_roles" FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public."BeloriBH_user_roles" FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public."BeloriBH_user_roles" FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Customers: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage customers"
  ON public."BeloriBH_customers" FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage orders"
  ON public."BeloriBH_orders" FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Order Items: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage order items"
  ON public."BeloriBH_order_items" FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- TRIGGERS

-- Trigger para criar profile automaticamente quando usuário se registra
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_beloribh_profiles_updated_at
  BEFORE UPDATE ON public."BeloriBH_profiles"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beloribh_customers_updated_at
  BEFORE UPDATE ON public."BeloriBH_customers"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beloribh_orders_updated_at
  BEFORE UPDATE ON public."BeloriBH_orders"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número de pedido único
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