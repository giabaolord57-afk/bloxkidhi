-- Run in Supabase SQL Editor. Assumes public.orders already exists.
CREATE TABLE IF NOT EXISTS public.admin_users (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.is_bloxshop_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.is_bloxshop_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bloxshop_admin() TO authenticated;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bloxshop_admin_read ON public.orders;
DROP POLICY IF EXISTS bloxshop_admin_update ON public.orders;
CREATE POLICY bloxshop_admin_read ON public.orders FOR SELECT TO authenticated USING ((SELECT public.is_bloxshop_admin()));
CREATE POLICY bloxshop_admin_update ON public.orders FOR UPDATE TO authenticated USING ((SELECT public.is_bloxshop_admin())) WITH CHECK ((SELECT public.is_bloxshop_admin()));
-- After creating a user in Authentication > Users, replace UID below and run separately:
-- INSERT INTO public.admin_users(user_id) VALUES ('REPLACE_WITH_AUTH_USER_UUID') ON CONFLICT DO NOTHING;
-- Audit/remove any older permissive orders policies before going live.
