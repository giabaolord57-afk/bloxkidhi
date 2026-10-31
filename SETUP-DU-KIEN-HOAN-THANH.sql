-- Chạy một lần trong Supabase SQL Editor. Sao lưu trước khi áp dụng.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_completion_at timestamptz;
CREATE TABLE IF NOT EXISTS public.order_eta_rules (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 keyword text NOT NULL UNIQUE,
 hours_to_complete integer NOT NULL CHECK(hours_to_complete > 0 AND hours_to_complete <= 8760),
 priority integer NOT NULL DEFAULT 100,
 enabled boolean NOT NULL DEFAULT true
);
ALTER TABLE public.order_eta_rules ENABLE ROW LEVEL SECURITY;
-- Không mở policy công khai: quy tắc được đọc qua hàm trigger SECURITY DEFINER.
-- Quy tắc mẫu xác thực từ nội dung shop: Robux 120H. Admin có thể chỉnh quy tắc khác.
INSERT INTO public.order_eta_rules(keyword,hours_to_complete,priority) VALUES ('robux',120,10)
ON CONFLICT(keyword) DO NOTHING;
CREATE OR REPLACE FUNCTION public.bloxshop_auto_eta() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE h integer;
BEGIN
 IF TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.product IS DISTINCT FROM OLD.product) THEN
   IF NEW.estimated_completion_at IS NULL THEN
     SELECT r.hours_to_complete INTO h FROM public.order_eta_rules r
     WHERE r.enabled AND lower(coalesce(NEW.product,'')) LIKE '%' || lower(r.keyword) || '%'
     ORDER BY r.priority ASC, length(r.keyword) DESC LIMIT 1;
     IF h IS NOT NULL THEN NEW.estimated_completion_at:=coalesce(NEW.created_at,now()) + make_interval(hours=>h); END IF;
   END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bloxshop_auto_eta ON public.orders;
CREATE TRIGGER trg_bloxshop_auto_eta BEFORE INSERT OR UPDATE OF product ON public.orders FOR EACH ROW EXECUTE FUNCTION public.bloxshop_auto_eta();
-- Áp dụng quy tắc cho đơn cũ chưa có thời gian dự kiến (không ghi đè thời gian Admin đã nhập).
UPDATE public.orders o SET estimated_completion_at=o.created_at + make_interval(hours=>r.hours_to_complete)
FROM public.order_eta_rules r
WHERE o.estimated_completion_at IS NULL AND r.enabled AND lower(coalesce(o.product,'')) LIKE '%'||lower(r.keyword)||'%'
AND r.id=(SELECT rr.id FROM public.order_eta_rules rr WHERE rr.enabled AND lower(coalesce(o.product,'')) LIKE '%'||lower(rr.keyword)||'%' ORDER BY rr.priority,length(rr.keyword) DESC LIMIT 1);
-- Giữ kiểm tra token gốc; chỉ bổ sung trường ETA vào kết quả đã xác thực.
CREATE OR REPLACE FUNCTION public.lookup_bloxshop_order(p_code text,p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
 IF length(coalesce(p_code,'')) > 30 OR length(coalesce(p_token,'')) <> 64 THEN RETURN NULL; END IF;
 SELECT jsonb_build_object('code',o.order_code,'status',o.status,'total',o.price,'lines',o.product::jsonb,'created_at',o.created_at,'estimated_completion_at',o.estimated_completion_at)
 INTO result FROM public.orders o JOIN public.order_access a ON a.order_id=o.id
 WHERE o.order_code=p_code AND a.token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.lookup_bloxshop_order(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_bloxshop_order(text,text) TO anon,authenticated;
-- Thêm quy tắc sau khi xác nhận thời gian thực tế của shop:
-- INSERT INTO public.order_eta_rules(keyword,hours_to_complete,priority) VALUES ('cày thuê',72,20);
