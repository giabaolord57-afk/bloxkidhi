-- ============================================================
-- CHAT CSKH V3: phiên hỗ trợ. Sau khi khách đánh giá xong sẽ mở PHIÊN MỚI (khung chat trống),
-- nút "Đã giải quyết" chỉ dùng được khi khách đã nhắn ít nhất 1 tin trong phiên hiện tại.
-- Chạy SAU SETUP-CHAT-CSKH-V2.sql, trong Supabase SQL Editor (chạy lại nhiều lần được).
-- ============================================================

ALTER TABLE public.support_chats    ADD COLUMN IF NOT EXISTS session_no int NOT NULL DEFAULT 1;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS session_no int NOT NULL DEFAULT 1;
ALTER TABLE public.support_ratings  ADD COLUMN IF NOT EXISTS session_no int NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS support_messages_session_idx ON public.support_messages(chat_id, session_no, id);

-- Tin của khách: gắn vào phiên hiện tại
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
  INSERT INTO public.support_messages(chat_id, sender, body, image_path, session_no) VALUES (c.id, 'user', b, p_image_path, c.session_no) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = CASE WHEN b = '' THEN '📷 Ảnh' ELSE left(b, 120) END,
    last_message_at = now(), unread_admin = unread_admin + 1, status = 'open' WHERE id = c.id;
  RETURN mid;
END $$;

-- Tin của Admin: gắn vào phiên hiện tại của khách
CREATE OR REPLACE FUNCTION public.support_admin_send(p_chat_id uuid, p_body text, p_image_path text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE b text := btrim(coalesce(p_body,'')); mid bigint; sn int;
BEGIN
  IF NOT public.is_bloxshop_admin() THEN RAISE EXCEPTION 'Không có quyền Admin'; END IF;
  IF char_length(b) > 1000 OR (b = '' AND p_image_path IS NULL) THEN RAISE EXCEPTION 'Tin nhắn không hợp lệ'; END IF;
  IF p_image_path IS NOT NULL AND left(p_image_path, 37) <> p_chat_id::text || '/' THEN RAISE EXCEPTION 'Ảnh không hợp lệ'; END IF;
  SELECT session_no INTO sn FROM public.support_chats WHERE id = p_chat_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy hội thoại'; END IF;
  INSERT INTO public.support_messages(chat_id, sender, body, image_path, session_no) VALUES (p_chat_id, 'admin', b, p_image_path, sn) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = CASE WHEN b = '' THEN 'Admin: 📷 Ảnh' ELSE left('Admin: ' || b, 120) END,
    last_message_at = now(), unread_user = unread_user + 1, status = 'open' WHERE id = p_chat_id;
  RETURN mid;
END $$;

-- Đánh giá: yêu cầu khách đã nhắn trong phiên, lưu đánh giá (kèm icon), đóng phiên cũ và mở phiên mới. Trả về số phiên mới.
DROP FUNCTION IF EXISTS public.support_resolve(int, text);
CREATE OR REPLACE FUNCTION public.support_resolve(p_rating int, p_comment text DEFAULT '')
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c public.support_chats; cm text := left(btrim(coalesce(p_comment,'')), 500); msg text;
        faces text[] := ARRAY['😡','😞','😐','🙂','🤩'];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Số sao không hợp lệ'; END IF;
  SELECT * INTO c FROM public.support_chats WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Chưa có hội thoại CSKH'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.support_messages
                  WHERE chat_id = c.id AND session_no = c.session_no AND sender = 'user'
                    AND (image_path IS NOT NULL OR body <> 'Tôi cần gặp nhân viên hỗ trợ')) THEN
    RAISE EXCEPTION 'Bạn cần nhắn tin cho nhân viên trước khi xác nhận đã giải quyết';
  END IF;
  IF EXISTS (SELECT 1 FROM public.support_ratings WHERE chat_id = c.id AND created_at > now() - interval '1 minute') THEN
    RAISE EXCEPTION 'Bạn vừa gửi đánh giá, vui lòng chờ một chút';
  END IF;
  INSERT INTO public.support_ratings(chat_id, user_id, username, rating, comment, session_no) VALUES (c.id, auth.uid(), c.username, p_rating, cm, c.session_no);
  msg := '✅ Vấn đề đã được giải quyết (kết thúc phiên #' || c.session_no || ')' || E'\nĐánh giá: ' || faces[p_rating] || ' ' || repeat('★', p_rating) || repeat('☆', 5 - p_rating) || ' (' || p_rating || '/5)'
         || CASE WHEN cm <> '' THEN E'\n“' || cm || '”' ELSE '' END;
  INSERT INTO public.support_messages(chat_id, sender, body, session_no) VALUES (c.id, 'user', left(msg, 1000), c.session_no);
  UPDATE public.support_chats SET status = 'closed', mode = 'ai', session_no = c.session_no + 1,
    last_message = left(msg, 120), last_message_at = now(), unread_admin = unread_admin + 1 WHERE id = c.id;
  RETURN c.session_no + 1;
END $$;

REVOKE ALL ON FUNCTION public.support_send_message(text,text), public.support_admin_send(uuid,text,text), public.support_resolve(int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_send_message(text,text), public.support_admin_send(uuid,text,text), public.support_resolve(int,text) TO authenticated;
