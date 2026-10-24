-- Dán toàn bộ vào Supabase SQL Editor. Không xóa dữ liệu trong orders hoặc order_access.
CREATE TABLE IF NOT EXISTS public.admin_archived_orders (order_id text PRIMARY KEY, archived_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.admin_archived_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_archived_orders FROM anon;
GRANT SELECT, INSERT, DELETE ON public.admin_archived_orders TO authenticated;
DROP POLICY IF EXISTS admin_archive_select ON public.admin_archived_orders;
DROP POLICY IF EXISTS admin_archive_insert ON public.admin_archived_orders;
DROP POLICY IF EXISTS admin_archive_delete ON public.admin_archived_orders;
CREATE POLICY admin_archive_select ON public.admin_archived_orders FOR SELECT TO authenticated USING ((SELECT public.is_bloxshop_admin()));
CREATE POLICY admin_archive_insert ON public.admin_archived_orders FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_bloxshop_admin()));
CREATE POLICY admin_archive_delete ON public.admin_archived_orders FOR DELETE TO authenticated USING ((SELECT public.is_bloxshop_admin()));
