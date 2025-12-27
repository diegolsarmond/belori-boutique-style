-- Create suppliers table
CREATE TABLE public."BeloriBH_suppliers" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public."BeloriBH_products" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public."BeloriBH_suppliers"(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  additional_images TEXT[],
  category TEXT,
  colors TEXT[],
  sizes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public."BeloriBH_site_settings" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default footer settings
INSERT INTO public."BeloriBH_site_settings" (setting_key, setting_value) VALUES
  ('footer_email', 'contato@example.com'),
  ('footer_phone', '(11) 99999-9999'),
  ('footer_address', 'Rua Exemplo, 123 - São Paulo, SP'),
  ('footer_whatsapp', '5511999999999');

-- Enable RLS
ALTER TABLE public."BeloriBH_suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeloriBH_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeloriBH_site_settings" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Anyone can view active suppliers"
  ON public."BeloriBH_suppliers" FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage suppliers"
  ON public."BeloriBH_suppliers" FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON public."BeloriBH_products" FOR SELECT
  USING (is_active = true AND stock_quantity > 0);

CREATE POLICY "Admins can manage products"
  ON public."BeloriBH_products" FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for site_settings
CREATE POLICY "Anyone can view site settings"
  ON public."BeloriBH_site_settings" FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public."BeloriBH_site_settings" FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_beloribh_suppliers_updated_at
  BEFORE UPDATE ON public."BeloriBH_suppliers"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beloribh_products_updated_at
  BEFORE UPDATE ON public."BeloriBH_products"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beloribh_site_settings_updated_at
  BEFORE UPDATE ON public."BeloriBH_site_settings"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));