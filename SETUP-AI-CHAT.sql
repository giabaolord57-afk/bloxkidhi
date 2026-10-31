-- AI CHAT (Gemini): bảng ghi lượt gọi để giới hạn spam / chặn vượt hạn mức miễn phí.
-- Chạy trong Supabase SQL Editor (chạy lại nhiều lần được). Chỉ Edge Function (service_role) đọc/ghi.
CREATE TABLE IF NOT EXISTS public.ai_chat_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_chat_log_ip_idx ON public.ai_chat_log(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_chat_log_time_idx ON public.ai_chat_log(created_at DESC);
ALTER TABLE public.ai_chat_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_chat_log FROM anon, authenticated;
