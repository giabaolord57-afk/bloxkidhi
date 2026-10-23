-- Chạy một lần trong Supabase SQL Editor để bật ảnh cho Acc tự chọn.
ALTER TABLE public.acc_inventory
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';

-- Bucket ảnh công khai để website hiển thị ảnh sản phẩm.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('acc-images', 'acc-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'];

DROP POLICY IF EXISTS "Public can view acc images" ON storage.objects;
CREATE POLICY "Public can view acc images" ON storage.objects
  FOR SELECT USING (bucket_id = 'acc-images');
DROP POLICY IF EXISTS "Admins can upload acc images" ON storage.objects;
CREATE POLICY "Admins can upload acc images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'acc-images' AND (SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS "Admins can update acc images" ON storage.objects;
CREATE POLICY "Admins can update acc images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'acc-images' AND (SELECT public.is_bloxshop_admin()))
  WITH CHECK (bucket_id = 'acc-images' AND (SELECT public.is_bloxshop_admin()));
DROP POLICY IF EXISTS "Admins can delete acc images" ON storage.objects;
CREATE POLICY "Admins can delete acc images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'acc-images' AND (SELECT public.is_bloxshop_admin()));
