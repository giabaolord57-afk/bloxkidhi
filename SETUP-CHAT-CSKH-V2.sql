-- ============================================================
-- CHAT CSKH V2: gửi ảnh + "Vấn đề đã được giải quyết" kèm đánh giá 1-5 sao.
-- Chạy SAU SETUP-CHAT-CSKH.sql, trong Supabase SQL Editor (chạy lại nhiều lần được).
-- ============================================================

-- 1) Tin nhắn có ảnh
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.support_messages ALTER COLUMN body SET DEFAULT '';
ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_body_check;
ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_content_check;
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_content_check
  CHECK (char_length(body) <= 1000 AND (char_length(body) > 0 OR image_path IS NOT NULL) AND (image_path IS NULL OR char_length(image_path) <= 200));

-- 2) Kho ảnh riêng tư (khách chỉ thấy ảnh trong hội thoại của mình, Admin thấy tất cả)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('support-images', 'support-images', false, 3145728, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DROP POLICY IF EXISTS support_img_insert ON storage.objects;
CREATE POLICY support_img_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support-images' AND (public.is_bloxshop_admin() OR EXISTS (
    SELECT 1 FROM public.support_chats c WHERE c.user_id = (SELECT auth.uid()) AND c.id::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS support_img_select ON storage.objects;
CREATE POLICY support_img_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support-images' AND (public.is_bloxshop_admin() OR EXISTS (
    SELECT 1 FROM public.support_chats c WHERE c.user_id = (SELECT auth.uid()) AND c.id::text = (storage.foldername(name))[1])));

-- 3) Hàm gửi tin có ảnh (thay bản cũ)
DROP FUNCTION IF EXISTS public.support_send_message(text);
CREATE OR REPLACE FUNCTION public.support_send_message(p_body text, p_image_path text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c public.support_chats; b text := btrim(coalesce(p_body,'')); mid bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  IF char_length(b) > 1000 OR (b = '' AND p_image_path IS NULL) THEN RAISE EXCEPTION 'Tin nhắn không hợp lệ'; END IF;
  SELECT * INTO c FROM public.support_chats WHERE user_id = auth.uid();
  IF NOT FOUND OR c.mode <> 'admin' THEN RAISE EXCEPTION 'Chưa kết nối nhân viên CSKH'; END IF;
  IF p_image_path IS NOT NULL AND left(p_image_path, 37) <> c.id::text || '/' THEN RAISE EXCEPTION 'Ảnh không hợp lệ'; END IF;
  IF (SELECT count(*) FROM public.support_messages WHERE chat_id = c.id AND sender='user' AND created_at > now() - interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'Bạn gửi quá nhanh, vui lòng chờ một chút';
  END IF;
  INSERT INTO public.support_messages(chat_id, sender, body, image_path) VALUES (c.id, 'user', b, p_image_path) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = CASE WHEN b = '' THEN '📷 Ảnh' ELSE left(b, 120) END,
    last_message_at = now(), unread_admin = unread_admin + 1, status = 'open' WHERE id = c.id;
  RETURN mid;
END $$;

DROP FUNCTION IF EXISTS public.support_admin_send(uuid, text);
CREATE OR REPLACE FUNCTION public.support_admin_send(p_chat_id uuid, p_body text, p_image_path text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE b text := btrim(coalesce(p_body,'')); mid bigint;
BEGIN
  IF NOT public.is_bloxshop_admin() THEN RAISE EXCEPTION 'Không có quyền Admin'; END IF;
  IF char_length(b) > 1000 OR (b = '' AND p_image_path IS NULL) THEN RAISE EXCEPTION 'Tin nhắn không hợp lệ'; END IF;
  IF p_image_path IS NOT NULL AND left(p_image_path, 37) <> p_chat_id::text || '/' THEN RAISE EXCEPTION 'Ảnh không hợp lệ'; END IF;
  INSERT INTO public.support_messages(chat_id, sender, body, image_path) VALUES (p_chat_id, 'admin', b, p_image_path) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = CASE WHEN b = '' THEN 'Admin: 📷 Ảnh' ELSE left('Admin: ' || b, 120) END,
    last_message_at = now(), unread_user = unread_user + 1, status = 'open' WHERE id = p_chat_id;
  RETURN mid;
END $$;

-- 4) Đánh giá sao khi khách bấm "Vấn đề đã được giải quyết"
CREATE TABLE IF NOT EXISTS public.support_ratings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_ratings_created_idx ON public.support_ratings(created_at DESC);
ALTER TABLE public.support_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_ratings FROM anon, authenticated;
GRANT SELECT ON public.support_ratings TO authenticated;
DROP POLICY IF EXISTS support_ratings_select ON public.support_ratings;
CREATE POLICY support_ratings_select ON public.support_ratings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_bloxshop_admin());

-- Lưu đánh giá, báo cho Admin bằng một tin nhắn trong hội thoại, đóng hội thoại và trả khách về chế độ AI.
CREATE OR REPLACE FUNCTION public.support_resolve(p_rating int, p_comment text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c public.support_chats; cm text := left(btrim(coalesce(p_comment,'')), 500); msg text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Số sao không hợp lệ'; END IF;
  SELECT * INTO c FROM public.support_chats WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Chưa có hội thoại CSKH'; END IF;
  IF EXISTS (SELECT 1 FROM public.support_ratings WHERE chat_id = c.id AND created_at > now() - interval '1 minute') THEN
    RAISE EXCEPTION 'Bạn vừa gửi đánh giá, vui lòng chờ một chút';
  END IF;
  INSERT INTO public.support_ratings(chat_id, user_id, username, rating, comment) VALUES (c.id, auth.uid(), c.username, p_rating, cm);
  msg := '✅ Vấn đề đã được giải quyết' || E'\nĐánh giá: ' || repeat('★', p_rating) || repeat('☆', 5 - p_rating) || ' (' || p_rating || '/5)'
         || CASE WHEN cm <> '' THEN E'\n“' || cm || '”' ELSE '' END;
  INSERT INTO public.support_messages(chat_id, sender, body) VALUES (c.id, 'user', left(msg, 1000));
  UPDATE public.support_chats SET status = 'closed', mode = 'ai', last_message = left(msg, 120), last_message_at = now(),
    unread_admin = unread_admin + 1 WHERE id = c.id;
END $$;

REVOKE ALL ON FUNCTION public.support_send_message(text,text), public.support_admin_send(uuid,text,text), public.support_resolve(int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_send_message(text,text), public.support_admin_send(uuid,text,text), public.support_resolve(int,text) TO authenticated;
