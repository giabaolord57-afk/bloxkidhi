-- BDShopVN: danh mục acc động + kho acc. Chạy sau ADMIN-QUYEN-SUPABASE.sql.
CREATE TABLE IF NOT EXISTS public.acc_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price integer NOT NULL DEFAULT 50000 CHECK (price >= 0),
  is_blindbag boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.acc_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.acc_categories(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  details text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sold boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Thông tin đăng nhập tách riêng để khách không thể đọc qua API công khai.
CREATE TABLE IF NOT EXISTS public.acc_credentials (
  account_id uuid PRIMARY KEY REFERENCES public.acc_inventory(id) ON DELETE CASCADE,
  login_info text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.acc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acc_categories, public.acc_inventory, public.acc_credentials FROM anon, authenticated;
GRANT SELECT ON public.acc_categories, public.acc_inventory TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_categories, public.acc_inventory, public.acc_credentials TO authenticated;
DROP POLICY IF EXISTS acc_categories_public_read ON public.acc_categories;
DROP POLICY IF EXISTS acc_categories_admin_read ON public.acc_categories;
CREATE POLICY acc_categories_public_read ON public.acc_categories FOR SELECT TO anon USING (active);
CREATE POLICY acc_categories_admin_read ON public.acc_categories FOR SELECT TO authenticated USING (active OR (SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS acc_inventory_public_read ON public.acc_inventory;
DROP POLICY IF EXISTS acc_inventory_admin_read ON public.acc_inventory;
CREATE POLICY acc_inventory_public_read ON public.acc_inventory FOR SELECT TO anon USING (active AND NOT sold);
CREATE POLICY acc_inventory_admin_read ON public.acc_inventory FOR SELECT TO authenticated USING ((active AND NOT sold) OR (SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS acc_categories_admin_all ON public.acc_categories;
CREATE POLICY acc_categories_admin_all ON public.acc_categories FOR ALL TO authenticated USING ((SELECT public.is_bloxshop_admin())) WITH CHECK ((SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS acc_inventory_admin_all ON public.acc_inventory;
CREATE POLICY acc_inventory_admin_all ON public.acc_inventory FOR ALL TO authenticated USING ((SELECT public.is_bloxshop_admin())) WITH CHECK ((SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS acc_credentials_admin_all ON public.acc_credentials;
CREATE POLICY acc_credentials_admin_all ON public.acc_credentials FOR ALL TO authenticated USING ((SELECT public.is_bloxshop_admin())) WITH CHECK ((SELECT public.is_bloxshop_admin()));
INSERT INTO public.acc_categories(name,price,is_blindbag,active) VALUES ('Túi mù',50000,true,true),('Acc tự chọn',50000,false,true)
ON CONFLICT(name) DO NOTHING;
