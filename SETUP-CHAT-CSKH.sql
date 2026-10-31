-- ============================================================
-- CHAT CSKH: khách bấm "Gặp CSKH" -> chat trực tiếp với Admin ngay trong khung Support 24/7.
-- Chạy SAU ADMIN-QUYEN-SUPABASE.sql (cần hàm is_bloxshop_admin) và MIGRATION-TAI-KHOAN-SUPABASE.sql.
-- Chạy toàn bộ file này trong Supabase SQL Editor (có thể chạy lại nhiều lần).
-- Bảo mật: khách chỉ đọc được hội thoại của chính mình; ghi dữ liệu chỉ qua các hàm RPC bên dưới.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'admin' CHECK (mode IN ('admin','ai')),   -- khách đang nói chuyện với Admin hay AI
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  last_message text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_admin int NOT NULL DEFAULT 0,
  unread_user int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_chat_idx ON public.support_messages(chat_id, id);
CREATE INDEX IF NOT EXISTS support_chats_last_idx ON public.support_chats(last_message_at DESC);

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_chats, public.support_messages FROM anon, authenticated;
GRANT SELECT ON public.support_chats, public.support_messages TO authenticated;

-- Chỉ cho ĐỌC (SELECT). Mọi thao tác ghi đi qua RPC SECURITY DEFINER.
DROP POLICY IF EXISTS support_chats_select ON public.support_chats;
CREATE POLICY support_chats_select ON public.support_chats FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_bloxshop_admin());

DROP POLICY IF EXISTS support_messages_select ON public.support_messages;
CREATE POLICY support_messages_select ON public.support_messages FOR SELECT TO authenticated
  USING (public.is_bloxshop_admin() OR EXISTS (
    SELECT 1 FROM public.support_chats c WHERE c.id = chat_id AND c.user_id = (SELECT auth.uid())));

-- ---------- KHÁCH ----------
-- Mở/tái mở hội thoại và chuyển sang chế độ Admin.
CREATE OR REPLACE FUNCTION public.support_open_chat(p_username text DEFAULT '')
RETURNS public.support_chats LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r public.support_chats;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  INSERT INTO public.support_chats(user_id, username, mode, status)
  VALUES (auth.uid(), left(coalesce(p_username,''), 40), 'admin', 'open')
  ON CONFLICT (user_id) DO UPDATE SET mode='admin', status='open',
    username = CASE WHEN excluded.username <> '' THEN excluded.username ELSE public.support_chats.username END
  RETURNING * INTO r;
  RETURN r;
END $$;

-- Đổi chế độ: 'admin' (nhân viên trả lời) hoặc 'ai' (AI trả lời).
CREATE OR REPLACE FUNCTION public.support_set_mode(p_mode text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  IF p_mode NOT IN ('admin','ai') THEN RAISE EXCEPTION 'Chế độ không hợp lệ'; END IF;
  UPDATE public.support_chats SET mode = p_mode WHERE user_id = auth.uid();
END $$;

-- Khách gửi tin cho Admin (chỉ khi đang ở chế độ Admin).
CREATE OR REPLACE FUNCTION public.support_send_message(p_body text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c public.support_chats; b text := btrim(coalesce(p_body,'')); mid bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  IF b = '' OR char_length(b) > 1000 THEN RAISE EXCEPTION 'Tin nhắn không hợp lệ'; END IF;
  SELECT * INTO c FROM public.support_chats WHERE user_id = auth.uid();
  IF NOT FOUND OR c.mode <> 'admin' THEN RAISE EXCEPTION 'Chưa kết nối nhân viên CSKH'; END IF;
  IF (SELECT count(*) FROM public.support_messages WHERE chat_id = c.id AND sender='user' AND created_at > now() - interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'Bạn gửi quá nhanh, vui lòng chờ một chút';
  END IF;
  INSERT INTO public.support_messages(chat_id, sender, body) VALUES (c.id, 'user', b) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = left(b, 120), last_message_at = now(),
    unread_admin = unread_admin + 1, status = 'open' WHERE id = c.id;
  RETURN mid;
END $$;

CREATE OR REPLACE FUNCTION public.support_mark_read_user()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.support_chats SET unread_user = 0 WHERE user_id = auth.uid();
$$;

-- ---------- ADMIN ----------
CREATE OR REPLACE FUNCTION public.support_admin_send(p_chat_id uuid, p_body text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE b text := btrim(coalesce(p_body,'')); mid bigint;
BEGIN
  IF NOT public.is_bloxshop_admin() THEN RAISE EXCEPTION 'Không có quyền Admin'; END IF;
  IF b = '' OR char_length(b) > 1000 THEN RAISE EXCEPTION 'Tin nhắn không hợp lệ'; END IF;
  INSERT INTO public.support_messages(chat_id, sender, body) VALUES (p_chat_id, 'admin', b) RETURNING id INTO mid;
  UPDATE public.support_chats SET last_message = left('Admin: ' || b, 120), last_message_at = now(),
    unread_user = unread_user + 1, status = 'open' WHERE id = p_chat_id;
  RETURN mid;
END $$;

CREATE OR REPLACE FUNCTION public.support_admin_mark_read(p_chat_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_bloxshop_admin() THEN RAISE EXCEPTION 'Không có quyền Admin'; END IF;
  UPDATE public.support_chats SET unread_admin = 0 WHERE id = p_chat_id;
END $$;

CREATE OR REPLACE FUNCTION public.support_admin_set_status(p_chat_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_bloxshop_admin() THEN RAISE EXCEPTION 'Không có quyền Admin'; END IF;
  IF p_status NOT IN ('open','closed') THEN RAISE EXCEPTION 'Trạng thái không hợp lệ'; END IF;
  UPDATE public.support_chats SET status = p_status WHERE id = p_chat_id;
END $$;

REVOKE ALL ON FUNCTION public.support_open_chat(text), public.support_set_mode(text), public.support_send_message(text),
  public.support_mark_read_user(), public.support_admin_send(uuid,text), public.support_admin_mark_read(uuid),
  public.support_admin_set_status(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_open_chat(text), public.support_set_mode(text), public.support_send_message(text),
  public.support_mark_read_user(), public.support_admin_send(uuid,text), public.support_admin_mark_read(uuid),
  public.support_admin_set_status(uuid,text) TO authenticated;

-- ---------- REALTIME (tin nhắn hiện ngay không cần tải lại) ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='support_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='support_chats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chats;
  END IF;
END $$;
