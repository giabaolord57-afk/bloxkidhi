-- BDShopVN: liên kết đơn hàng mới với tài khoản Supabase đang đăng nhập.
-- Chạy trong Supabase SQL Editor sau khi sao lưu database.
-- Đơn cũ không tự động gán cho tài khoản nào vì schema cũ không lưu auth user ID.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON public.orders(user_id, created_at DESC);

-- Gán chủ sở hữu cho đơn mới bằng UID từ JWT hiện tại.
-- Với khách chưa đăng nhập, user_id vẫn NULL và đơn tiếp tục hoạt động như trước.
CREATE OR REPLACE FUNCTION public.set_bloxshop_order_user_id()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_bloxshop_order_user_id ON public.orders;
CREATE TRIGGER trg_set_bloxshop_order_user_id
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_bloxshop_order_user_id();

-- RPC chỉ trả về các đơn thuộc UID đang đăng nhập; không cần cấp SELECT trực tiếp lên bảng orders.
CREATE OR REPLACE FUNCTION public.get_my_bloxshop_orders()
RETURNS TABLE(order_code text, product text, price numeric, status text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bạn cần đăng nhập để xem lịch sử đơn hàng';
  END IF;
  RETURN QUERY
    SELECT o.order_code::text, o.product::text, o.price::numeric, o.status::text, o.created_at::timestamptz
    FROM public.orders o
    WHERE o.user_id = v_uid
    ORDER BY o.created_at DESC
    LIMIT 100;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_bloxshop_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_bloxshop_orders() TO authenticated;

-- Lưu ý: secure email change cần bật trong Supabase Auth.
-- Với đổi email, Supabase có thể yêu cầu xác nhận cả email cũ và email mới tùy cấu hình.
-- Với OTP khôi phục, đặt template Reset Password sử dụng {{ .Token }} và xác minh bằng type='recovery'.
-- Với đăng ký OTP, template Confirm signup cũng cần dùng {{ .Token }}.
