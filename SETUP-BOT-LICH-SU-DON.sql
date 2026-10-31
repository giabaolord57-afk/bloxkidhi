-- Chạy sau MIGRATION-TAI-KHOAN-SUPABASE.sql và SETUP-DU-KIEN-HOAN-THANH.sql.
-- Chỉ lấy đơn thuộc tài khoản đăng nhập. Không cấp quyền đọc bảng orders trực tiếp.
CREATE OR REPLACE FUNCTION public.get_my_bloxshop_orders()
RETURNS TABLE(order_code text, product text, price numeric, status text, created_at timestamptz, estimated_completion_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
 RETURN QUERY SELECT o.order_code::text,o.product::text,o.price::numeric,o.status::text,o.created_at,o.estimated_completion_at
 FROM public.orders o WHERE o.user_id=auth.uid() ORDER BY o.created_at DESC LIMIT 100;
END $$;
REVOKE ALL ON FUNCTION public.get_my_bloxshop_orders() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_bloxshop_orders() TO authenticated;
