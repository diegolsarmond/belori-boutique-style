CREATE TABLE public."BeloriBH_payment_settings" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE, -- e.g. 'mercadopago'
  access_token TEXT,
  public_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public."BeloriBH_payment_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings"
  ON public."BeloriBH_payment_settings" FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_beloribh_payment_settings_updated_at
  BEFORE UPDATE ON public."BeloriBH_payment_settings"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
