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


=== TAI KHOAN TEN DANG NHAP VA LICH SU DON HANG ===
1. Upload tai-khoan.html len cung thu muc goc voi index.html. Link Tai khoan da duoc them vao menu.
2. Trong Supabase SQL Editor, chay file MIGRATION-TAI-KHOAN-SUPABASE.sql. File nay them lien ket user_id cho don moi; cac don cu khong the tu dong gan vao tai khoan.
3. Supabase Dashboard > Authentication > Providers > Email: bat dang ky Email, NHUNG TAT Confirm email / Email confirmations. Giao dien khach khong thu thap email; code tao dia chi noi bo dang username@users.bdshopvn.invalid de Supabase Auth co the quan ly mat khau. Dia chi nay khong phai email that va khong nhan thu.
4. Ten dang nhap 3-24 ky tu, chi gom chu khong dau, so va dau gach duoi. Mat khau phai co it nhat 8 ky tu va duoc nhap lai de xac nhan.
5. QUAN TRONG: vi khong co email/so dien thoai, khach khong the tu khoi phuc tai khoan neu quen mat khau. Can bao khach ghi nho ten dang nhap va mat khau; khong tu dong tao chuc nang dat lai mat khau.
6. Tai khoan da tao truoc day bang email that khong tu dong dang nhap bang ten dang nhap moi. Can tiep tuc dung luong dang nhap cu hoac xu ly chuyen doi rieng truoc khi ap dung cho tai khoan cu.
7. Them URL production https://TEN-MIEN-VERCEL/tai-khoan.html vao Authentication > URL Configuration > Redirect URLs neu can cho trang tai khoan. Thay TEN-MIEN-VERCEL bang mien that cua shop.
8. Kiem tra bang hai tai khoan khac nhau: moi tai khoan chi xem duoc don hang tao khi dang nhap bang tai khoan do. Don cu khong the tu dong gan vao tai khoan.
9. Chi dung publishable/anon key tren frontend. Khong dua service_role/secret key vao HTML hoac GitHub.
10. Mat khau duoc Supabase Auth quan ly, khong luu mat khau dang ro vao bang tu tao. Nut con mat chi hien/an mat khau tren man hinh nhap.
11. Trang thanh toan yeu cau khach dang nhap truoc khi dat don de don moi duoc gan dung tai khoan va hien trong lich su.

THANH TOÁN CHUYỂN KHOẢN / THẺ CÀO VÀ GỬI BILL
1. Mở Supabase Dashboard > SQL Editor, chạy toàn bộ file SETUP-THANH-TOAN-BILL-THE-CAO.sql bằng tài khoản chủ dự án.
2. File này tạo bảng payment_submissions và Storage bucket riêng tư payment-bills để lưu ảnh/PDF bill tối đa 5 MB. Admin xem bill qua đường dẫn ký có hạn 5 phút.
3. Trong js/data.js, điền bankCode, accountNo và accountName thật để hiện QR VietQR trên trang thanh toán. Không điền thông tin giả.
4. Khách chọn Chuyển khoản hoặc Thẻ cào trong giỏ hàng. Chuyển khoản có thể đính kèm ảnh/PDF bill; thẻ cào yêu cầu nhà mạng, mệnh giá, mã thẻ và serial.
5. Admin đăng nhập admin.html, kéo xuống mục “Bill chuyển khoản & thẻ cào” để xem thông tin, mở bill, ghi chú và cập nhật trạng thái “Đã xác nhận” hoặc “Từ chối”. Việc kiểm tra thẻ và tiền chuyển khoản vẫn là thủ công; giao diện không tự xác minh mã thẻ hay giao dịch ngân hàng.
6. Quy tắc phí đang hiển thị: dưới 50.000đ = 20%; 50.000–100.000đ = 15%; trên 100.000đ = 10%. Đây là phần chiết khấu trừ khỏi mệnh giá để tính giá trị quy đổi, không phải cổng thanh toán tự động.
7. Vì dữ liệu thanh toán chứa mã thẻ/serial, chỉ admin được đọc bảng này. Không gửi mã thẻ công khai qua tin nhắn hoặc ảnh chụp màn hình.
