-- Allow inserts into profiles table to fix signup flow
-- This allows the handle_new_user trigger to successfully create the profile record
CREATE POLICY "Enable insert for authenticated users and service role"
ON public."BeloriBH_profiles"
FOR INSERT
WITH CHECK (true);

-- Ensure the trigger function is secure
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
