-- BLOXSHOP: Chạy từng khối lệnh riêng nếu SQL Editor yêu cầu singular query.
-- Kiểm tra giá catalog trước khi mở bán; giá gốc trong ZIP là giá tạm.
CREATE TABLE IF NOT EXISTS public.shop_catalog (product_key text PRIMARY KEY, name text NOT NULL, price numeric NOT NULL CHECK (price >= 0));

INSERT INTO public.shop_catalog(product_key,name,price) VALUES
('item|robux-120h|rb-400','400 Robux',100000),
('item|robux-120h|rb-800','800 Robux',175000),
('item|robux-120h|rb-1700','1.700 Robux',340000),
('item|robux-120h|rb-4500','4.500 Robux',830000),
('item|robux-120h|rb-10000','10.000 Robux',1770000),
('item|trai-vinh-vien|pf-kitsune','Kitsune (Permanent)',280000),
('item|trai-vinh-vien|pf-dragon','Dragon (Permanent)',250000),
('item|trai-vinh-vien|pf-leopard','Leopard (Permanent)',220000),
('item|trai-vinh-vien|pf-dough','Dough (Permanent)',170000),
('item|trai-vinh-vien|pf-portal','Portal (Permanent)',110000),
('item|trai-vinh-vien|pf-buddha','Buddha (Permanent)',100000),
('item|trai-vinh-vien|pf-venom','Venom (Permanent)',95000),
('item|trai-vinh-vien|pf-control','Control (Permanent)',160000),
('item|trai-vinh-vien|pf-spirit','Spirit (Permanent)',105000),
('item|trai-vinh-vien|pf-gravity','Gravity (Permanent)',115000),
('item|trai-vinh-vien|pf-mammoth','Mammoth (Permanent)',90000),
('item|trai-vinh-vien|pf-trex','T-Rex (Permanent)',110000),
('item|trai-ruong|ch-1','Divine Portal',190000),
('item|trai-ruong|ch-2','Ruby Diamond',60000),
('item|trai-ruong|ch-3','Topaz Diamond',60000),
('item|trai-ruong|ch-4','Rose Quartz Diamond',90000),
('item|trai-ruong|ch-5','Emerald Diamond',90000),
('item|trai-ruong|ch-6','Super Spirit Pain',320000),
('item|trai-ruong|ch-7','Celestial Pain',170000),
('item|trai-ruong|ch-8','Frustration Pain',140000),
('item|trai-ruong|ch-9','Sadness Pain',150000),
('item|trai-ruong|ch-10','Torment Pain',60000),
('item|trai-ruong|ch-11','Thermite Bomb',85000),
('item|trai-ruong|ch-12','Azura Bomb',85000),
('item|trai-ruong|ch-13','Nuclear Bomb',85000),
('item|trai-ruong|ch-14','Celebration Bomb',40000),
('item|trai-ruong|ch-15','Galaxy Empyrean Kitsune',1120000),
('item|trai-ruong|ch-16','Empyrean Kitsune',820000),
('item|trai-ruong|ch-17','West Dragon',470000),
('item|trai-ruong|ch-18','East Dragon',420000),
('item|trai-ruong|ch-19','Ember Dragon',720000),
('item|trai-ruong|ch-20','Purple Lightning',570000),
('item|trai-ruong|ch-21','Yellow Lightning',210000),
('item|trai-ruong|ch-22','Red Lightning',300000),
('item|trai-ruong|ch-23','Green Lightning',80000),
('item|trai-ruong|ch-24','Fiend Yeti',120000),
('item|trai-ruong|ch-25','Werewolf',130000),
('item|trai-ruong|ch-26','Lightning',40000),
('item|trai-ruong|ch-27','Shadow',32000),
('item|trai-ruong|ch-28','Pain',32000),
('item|trai-ruong|ch-29','Buddha',32000),
('item|trai-ruong|ch-30','Portal',32000),
('item|trai-ruong|ch-31','T-Rex',37000),
('item|trai-ruong|ch-32','Mammoth',30000),
('item|trai-ruong|ch-33','Spirit',40000),
('item|trai-ruong|ch-34','Gravity',32000),
('item|trai-ruong|ch-35','Venom',36999.5),
('item|trai-ruong|ch-36','Dough',37000),
('item|trai-ruong|ch-37','Gas',37000),
('item|trai-ruong|ch-38','Tiger',43000),
('item|trai-ruong|ch-39','Yeti',43000),
('item|trai-ruong|ch-40','Control',50000),
('item|trai-ruong|ch-41','Kitsune',95000),
('item|gamepass|gp-2xmoney','2x Money',140000),
('item|gamepass|gp-2xmastery','2x Mastery',140000),
('item|gamepass|gp-2xboss','2x Boss Drops',140000),
('item|gamepass|gp-fastboat','Fast Boats',125000),
('item|gamepass|gp-darkblade','Dark Blade',210000),
('item|gamepass|gp-notifier','Fruit Notifier',85000),
('item|gamepass|gp-storage','+1 Fruit Storage',110000),
('item|gamepass|gp-fruitcdn','Fruit Notifier + Storage',160000),
('boost|level|ct-1','1000 Level',40000),
('boost|level|ct-2','2800 Level ( MAX )',60000),
('boost|nhiemvu|ct-3','Full Nhiệm Vụ Pain ( Bao trái )',75000),
('boost|nhiemvu|ct-4','Full Nhiệm Vụ Control ( Bao trái )',80000),
('boost|nhiemvu|ct-5','Full Nhiệm Vụ Lighting ( Bao trái )',80000),
('boost|nhiemvu|ct-6','Full Nhiệm Vụ Gravity ( Bao trái )',70000),
('boost|nhiemvu|ct-7','Full Nhiệm Vụ Angle ( Bao trái )',70000),
('boost|nhiemvu|ct-8','Awaken Full Phoenix',60000),
('boost|nhiemvu|ct-9','Awaken Full Dough',60000),
('boost|nhiemvu|ct-10','Awaken Full Chiêu DF Dưới 1M',40000),
('boost|nhiemvu|ct-11','Full Mastery Gun,DF ( tự chọn )',50000),
('boost|nhiemvu|ct-12','Full Mastery Sword, Melee ( tự chọn )',45000),
('boost|toc|ct-13','Lấy Haki Draco',50000),
('boost|toc|ct-14','Haki Observation V2',45000),
('boost|toc|ct-15','Haki 7 màu',40000),
('boost|toc|ct-16','Lấy Tộc Draco',40000),
('boost|toc|ct-17','Lấy Tộc Cyborg',40000),
('boost|toc|ct-18','Lấy Tộc Quỷ',40000),
('boost|toc|ct-19','Up Tộc v1-v3',40000),
('boost|toc|ct-20','Draco v1-v3',50000),
('boost|toc|ct-21','Gạt cần cổng V4',40000),
('boost|toc|ct-22','Full Gear V4 Tự Chọn ( bao tất cả mọi thứ )',70000),
('boost|toc|ct-23','Combo Full Dragon : Lấy Tộc Dra v4, Lấy Heart + Storm 500 Mastery, Kéo Tim ( yêu cầu có đủ 8 đại và hoàn thành 20 lần hành trình biển )',170000),
('boost|vo|ct-24','Lấy GodHuman ( Bao tất cả mọi thứ )',50000),
('boost|vo|ct-25','Lấy Dragon Talon',40000),
('boost|vo|ct-26','Electric Claw v2',40000),
('boost|vo|ct-27','Lấy Sanguine Art',60000),
('boost|vo|ct-28','Up Yoru v1-v3 ( bao tất cả mọi thứ )',130000),
('boost|vo|ct-29','Yoru v3 ( yêu cầu có 4 tộc cơ bản v3 + yoru v2 )',120000),
('boost|vo|ct-30','Yoru v2',60000),
('boost|vo|ct-31','Lấy Yama',40000),
('boost|vo|ct-32','Lấy Tushita',40000),
('boost|vo|ct-33','Lấy CDK - Song Kiếm',55000),
('boost|vo|ct-34','True Triple Katana | TTK',50000),
('boost|vo|ct-35','Dark Dagger | Mini Yoru',80000),
('boost|vo|ct-36','Skull Guitar',50000),
('boost|vo|ct-37','Lấy 1 Trong Wando-Shishui-Saddi',40000),
('boost|vo|ct-38','Dark Coat | Áo Râu Đen',80000),
('boost|dragon|ct-39','Lấy 8 Đại ( yêu cầu dragon talon )',55000),
('boost|dragon|ct-40','Dragon Storm ( yêu cầu 8 đại )',60000),
('boost|dragon|ct-41','Dragon Heart ( yêu cầu 8 đại )',60000),
('boost|dragon|ct-42','Lấy Mặt Nạ Kitsune',45000),
('boost|dragon|ct-43','Lấy Kitsune Ribbon',45000),
('boost|dragon|ct-44','Fox Lamp',40000),
('boost|dragon|ct-45','Shark Anchor',40000),
('boost|dragon|ct-46','Lấy mảnh gương',40000),
('boost|dragon|ct-47','Đánh rip_indra',40000),
('boost|bien|ct-48','Lấy 30 Vảy Leviathan',100000),
('boost|bien|ct-49','Lấy 15 Vảy Leviathan',60000),
('boost|bien|ct-50','Lấy khiên leviathan',80000),
('boost|bien|ct-51','Kéo Tim Leviathan Về Hydra/Tiki',55000),
('boost|bien|ct-52','Hoàn thành 20 lần sự kiện biển',45000),
('boost|bien|ct-53','Đánh Tyrant of the skies',35000),
('boost|bien|ct-54','2 Nguyên Thạch Bóng Tối',50000),
('boost|nhan|ct-55','Random Nhẫn Cấp 3',110000),
('boost|nhan|ct-56','Random Nhẫn Cấp 4',270000),
('boost|tien|ct-57','1M Bounty',50000),
('boost|tien|ct-58','5M Bounty',120000),
('boost|tien|ct-59','10M Bounty',220000),
('boost|tien|ct-60','20M Bounty',420000),
('boost|tien|ct-61','30M Bounty',620000),
('boost|tien|ct-62','10M Belli',30000),
('boost|tien|ct-63','20M Belli',40000),
('boost|tien|ct-64','50M Belli',70000),
('boost|tien|ct-65','100M Belli',120000),
('boost|tien|ct-66','10K Fragment',35000),
('boost|tien|ct-67','20K Fragment',50000),
('boost|tien|ct-68','50K Fragment',95000),
('boost|tien|ct-69','100K Fragments',170000)
ON CONFLICT(product_key) DO UPDATE SET name=excluded.name, price=excluded.price;

ALTER TABLE public.shop_catalog ENABLE ROW LEVEL SECURITY;

-- Không cấp quyền trực tiếp cho khách vào orders/catalog. Hàm SECURITY DEFINER đọc giá từ catalog.
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.shop_catalog FROM anon, authenticated;

-- Chỉ Admin đọc/cập nhật orders, không cho sửa id hay dữ liệu khách qua REST.
REVOKE ALL ON public.orders FROM authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE(status) ON public.orders TO authenticated;

-- Token bí mật ngẫu nhiên dùng để tra cứu, không lưu token trong bảng orders.
CREATE TABLE IF NOT EXISTS public.order_access (order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE);

ALTER TABLE public.order_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.order_access FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.place_bloxshop_order(p_customer text, p_contact text, p_lines jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 x jsonb; v_key text; v_qty integer; v_days integer; v_name text; v_price numeric;
 v_total numeric := 0; v_lines jsonb := '[]'::jsonb; v_code text; v_token text; v_id uuid;
BEGIN
 IF length(trim(coalesce(p_customer,''))) NOT BETWEEN 1 AND 100
    OR length(trim(coalesce(p_contact,''))) NOT BETWEEN 3 AND 150 THEN
   RAISE EXCEPTION 'Thông tin khách hàng không hợp lệ';
 END IF;
 IF jsonb_typeof(p_lines) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_lines) NOT BETWEEN 1 AND 30 THEN
   RAISE EXCEPTION 'Giỏ hàng không hợp lệ';
 END IF;

 FOR x IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
   v_key := x->>'key';
   IF coalesce(x->>'qty','') !~ '^[0-9]{1,2}$' THEN
     RAISE EXCEPTION 'Số lượng không hợp lệ';
   END IF;
   v_qty := (x->>'qty')::integer;

   -- Dịch vụ Steal An Egg: ngày được mã hóa trong key từ giao diện hiện tại.
   IF v_key LIKE 'boost|steal-an-egg|steal-an-egg-daily-%d' THEN
     v_days := substring(v_key FROM '([0-9]{1,2})d$')::integer;
     IF v_days IS NULL OR v_days NOT BETWEEN 1 AND 99 THEN
       RAISE EXCEPTION 'Số ngày Steal An Egg phải từ 1 đến 99';
     END IF;
     IF v_qty <> 1 THEN
       RAISE EXCEPTION 'Mỗi lựa chọn số ngày Steal An Egg phải là một dòng riêng';
     END IF;
     v_name := format('Cày thuê Steal An Egg (%s ngày)', v_days);
     v_price := 25000 * v_days;
     v_total := v_total + v_price;
     v_lines := v_lines || jsonb_build_array(jsonb_build_object(
       'key',v_key,'name',v_name,'qty',1,'unit',v_price,
       'days',v_days,'rate_per_day',25000
     ));
   ELSE
     IF v_qty NOT BETWEEN 1 AND 20 THEN
       RAISE EXCEPTION 'Số lượng không hợp lệ';
     END IF;
     SELECT name, price INTO v_name, v_price
       FROM public.shop_catalog WHERE product_key=v_key;
     IF NOT FOUND THEN RAISE EXCEPTION 'Sản phẩm không tồn tại'; END IF;
     v_total := v_total + v_price*v_qty;
     v_lines := v_lines || jsonb_build_array(jsonb_build_object(
       'key',v_key,'name',v_name,'qty',v_qty,'unit',v_price
     ));
   END IF;
 END LOOP;

 IF v_total > 1000000000 THEN RAISE EXCEPTION 'Đơn hàng vượt giới hạn'; END IF;
 v_code := 'BX' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 v_token := encode(gen_random_bytes(32),'hex');
 INSERT INTO public.orders(order_code,customer_name,contact,product,price,status)
 VALUES(v_code,trim(p_customer),trim(p_contact),v_lines::text,v_total,'Chờ duyệt') RETURNING id INTO v_id;
 INSERT INTO public.order_access(order_id,token_hash)
 VALUES(v_id,encode(extensions.digest(v_token,'sha256'),'hex'));
 RETURN jsonb_build_object('code',v_code,'token',v_token,'total',v_total,'lines',v_lines,'status','Chờ duyệt');
END; $$;

REVOKE ALL ON FUNCTION public.place_bloxshop_order(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_bloxshop_order(text,text,jsonb) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.lookup_bloxshop_order(p_code text,p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
 IF length(coalesce(p_code,'')) > 30 OR length(coalesce(p_token,'')) <> 64 THEN RETURN NULL; END IF;
 SELECT jsonb_build_object('code',o.order_code,'status',o.status,'total',o.price,'lines',o.product::jsonb,'created_at',o.created_at)
 INTO result FROM public.orders o JOIN public.order_access a ON a.order_id=o.id
 WHERE o.order_code=p_code AND a.token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.lookup_bloxshop_order(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_bloxshop_order(text,text) TO anon,authenticated;

-- Cần pgcrypto (Supabase thường có trong extensions); bật nếu chưa có:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- Nếu digest không được nhận diện, thay digest(...) thành extensions.digest(...) trong hai hàm.
