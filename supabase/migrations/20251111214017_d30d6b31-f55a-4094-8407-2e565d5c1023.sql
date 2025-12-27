-- Create slides table
CREATE TABLE public."BeloriBH_slides" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."BeloriBH_slides" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
ON public."BeloriBH_slides"
FOR SELECT
USING (is_active = true);

-- Policy: Admins can manage all slides
CREATE POLICY "Admins can manage slides"
ON public."BeloriBH_slides"
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for slides
INSERT INTO storage.buckets (id, name, public) 
VALUES ('slides', 'slides', true);

-- Storage policies for slides bucket
CREATE POLICY "Anyone can view slide images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'slides');

CREATE POLICY "Admins can upload slide images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'slides' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update slide images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'slides' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete slide images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'slides' AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_beloribh_slides_updated_at
BEFORE UPDATE ON public."BeloriBH_slides"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();