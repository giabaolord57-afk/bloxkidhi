BLOXSHOP - HƯỚNG DẪN TRIỂN KHAI

1. KHÔNG upload SETUP_SUPABASE.sql lên website công khai nếu không cần. Mở file này và chạy từng câu lệnh trong Supabase SQL Editor, theo đúng thứ tự. Đoạn INSERT danh mục có 135 sản phẩm và là một câu lệnh lớn. Kiểm tra lại giá vì dữ liệu ZIP gốc ghi rõ là giá tạm.
2. Trong Supabase Extensions, bật pgcrypto (schema extensions) nếu chưa có. Nếu cần, chạy CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions; riêng lẻ trước các hàm.
3. Kiểm tra orders đã bật RLS, hai policy bloxshop_admin_read/update chỉ dành cho authenticated và gọi is_bloxshop_admin(). Kiểm tra admin_users đã bật RLS, không có policy ghi cho người dùng thường. Kiểm tra UID Admin có trong auth.users và admin_users. Kiểm tra không có policy public/anon rộng.
4. Upload nội dung thư mục này (index.html nằm ở gốc) lên GitHub Pages. Trang khách: index.html. Trang quản trị: admin.html. Đăng nhập bằng tài khoản Supabase Authentication đã tạo, KHÔNG dùng database password.
5. Đặt thử đơn nhỏ, xem xuất hiện trong orders và admin.html, duyệt, rồi mở Đơn hàng trên trình duyệt khách để kiểm tra đồng bộ. Không nhận tiền thật trước khi kiểm thử xong.
6. Không đăng tải Telegram bot token. Token từng xuất hiện trong ZIP gốc: thu hồi và tạo token mới bằng BotFather. Tích hợp Telegram sau này bằng Edge Function/secret, không đặt token trong JS.
7. Mã tra cứu bí mật nằm trong localStorage của thiết bị khách, nếu xóa dữ liệu trình duyệt sẽ mất khả năng tra cứu. Nên bổ sung phương thức khôi phục qua liên hệ được xác minh khi đưa vào vận hành lớn.
8. RPC đặt hàng có kiểm tra giá phía server, nhưng vẫn cần thêm CAPTCHA/rate limiting và chống spam trước khi mở bán rộng. Không xem việc tạo đơn là đã xác nhận thanh toán.
9. Nếu đã có policy cũ cho phép anon truy cập orders hoặc execute RPC khác, phải rà soát và thu hồi. Kiểm thử bằng tài khoản không phải admin.

10. KHO ACC ĐỘNG (MỚI): sau khi chạy ADMIN-QUYEN-SUPABASE.sql và đã có hàm is_bloxshop_admin(), chạy toàn bộ SETUP-QUAN-LY-ACC.sql trong Supabase SQL Editor. Script tạo sẵn danh mục Túi mù 50.000đ và Acc tự chọn 50.000đ nếu chưa có. Vào admin.html, đăng nhập tài khoản đã được cấp quyền Admin, dùng phần Quản lý danh mục acc để thêm danh mục/đổi giá; dùng phần Đăng acc vào kho để upload. Khách xem danh mục tại #/acc; danh mục túi mù hiện tại tại #/tui-mu. Mật khẩu/thông tin đăng nhập được lưu trong bảng riêng chỉ Admin được đọc; không đưa mật khẩu vào ô thông số công khai.


=== TAI KHOAN, XAC THUC EMAIL VA LICH SU DON HANG ===
1. Upload tai-khoan.html len cung thu muc goc voi index.html. Link Tai khoan da duoc them vao menu.
2. Trong Supabase SQL Editor, chay file MIGRATION-TAI-KHOAN-SUPABASE.sql. File nay them lien ket user_id cho don moi; cac don cu khong the tu dong gan vao tai khoan.
3. Supabase Dashboard > Authentication > Providers > Email: bat dang ky email va xac nhan email.
4. De nhap ma OTP khi dang ky/quen mat khau, sua Email Templates (Confirm signup va Reset Password) dung token {{ .Token }}. Neu template van gui link, can hoan tat theo link va cau hinh Redirect URLs.
5. Bat Secure email change trong Authentication > Settings/Security de yeu cau xac nhan khi doi email. Supabase co the gui xac nhan den ca email cu va email moi tuy cau hinh.
6. Them URL production https://TEN-MIEN-VERCEL/tai-khoan.html vao Authentication > URL Configuration > Redirect URLs. Thay TEN-MIEN-VERCEL bang mien that cua shop.
7. Kiem tra bang hai tai khoan khac nhau: moi tai khoan chi xem duoc don hang tao khi dang nhap bang tai khoan do. Don dat khi chua dang nhap van hoat dong nhu truoc nhung khong hien trong lich su tai khoan.
8. Chi dung publishable/anon key tren frontend. Khong dua service_role/secret key vao HTML hoac GitHub.
