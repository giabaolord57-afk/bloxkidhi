-- BDShopVN: giá riêng cho từng acc (dùng cho danh mục Acc tự chọn).
-- NULL nghĩa là dùng giá chung của danh mục. Chạy một lần trong Supabase SQL Editor.
ALTER TABLE public.acc_inventory
  ADD COLUMN IF NOT EXISTS price integer NULL CHECK (price IS NULL OR price >= 0);
