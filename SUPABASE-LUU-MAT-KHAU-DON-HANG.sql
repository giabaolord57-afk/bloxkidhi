-- BDShopVN: lưu mật khẩu đơn hàng riêng, không cho anon đọc trực tiếp.
-- Chạy sau SETUP_SUPABASE.sql trong Supabase SQL Editor.
-- LƯU Ý: đây là dữ liệu đăng nhập nhạy cảm. Chỉ dùng nếu khách đã đồng ý rõ ràng;
-- không tái sử dụng mật khẩu và xóa ngay khi không còn cần.

CREATE TABLE IF NOT EXISTS public.order_private_credentials (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  password_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_private_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_private_credentials FROM PUBLIC, anon, authenticated;

-- Khách chỉ có thể gửi mật khẩu nếu mã đơn + token bí mật trả về khi đặt đơn khớp.
CREATE OR REPLACE FUNCTION public.save_bloxshop_order_password(
  p_code text,
  p_token text,
  p_password text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order_id uuid;
BEGIN
  IF coalesce(length(p_code),0) NOT BETWEEN 1 AND 30
     OR coalesce(length(p_token),0) <> 64
     OR coalesce(length(p_password),0) NOT BETWEEN 1 AND 128 THEN
    RAISE EXCEPTION 'Thông tin không hợp lệ';
  END IF;

  SELECT o.id INTO v_order_id
  FROM public.orders o
  JOIN public.order_access a ON a.order_id = o.id
  WHERE o.order_code = p_code
    AND a.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Mã đơn hoặc token không hợp lệ';
  END IF;

  INSERT INTO public.order_private_credentials(order_id, password_value)
  VALUES (v_order_id, p_password)
  ON CONFLICT (order_id) DO UPDATE
    SET password_value = EXCLUDED.password_value, created_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.save_bloxshop_order_password(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_bloxshop_order_password(text,text,text) TO anon, authenticated;

-- Chỉ admin đã xác thực và được is_bloxshop_admin() cho phép mới đọc được.
CREATE OR REPLACE FUNCTION public.get_bloxshop_order_password(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_password text;
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(public.is_bloxshop_admin(), false) THEN
    RAISE EXCEPTION 'Không có quyền truy cập';
  END IF;
  SELECT password_value INTO v_password
  FROM public.order_private_credentials WHERE order_id = p_order_id;
  RETURN v_password;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bloxshop_order_password(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bloxshop_order_password(uuid) TO authenticated;

-- Tự xóa mật khẩu khi đơn chuyển sang Hoàn thành hoặc Từ chối.
CREATE OR REPLACE FUNCTION public.clear_bloxshop_order_password_on_finish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status IN ('Hoàn thành', 'Từ chối') AND OLD.status IS DISTINCT FROM NEW.status THEN
    DELETE FROM public.order_private_credentials WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_bloxshop_order_password_on_finish ON public.orders;
CREATE TRIGGER trg_clear_bloxshop_order_password_on_finish
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.clear_bloxshop_order_password_on_finish();
