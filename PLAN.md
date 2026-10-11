# Kế hoạch phát triển LearnHub

## Mục tiêu sản phẩm

LearnHub là nơi giảng viên tổ chức khóa học và lớp học, đăng bài giảng theo tuần, giao bài, nhận file bài làm và theo dõi tiến độ. Hệ thống không bị khóa cứng vào C/C++; có thể dùng tiếp cho SQL, Java và các môn khác.

## Đã hoàn thành

- [x] Xác thực Supabase và phân quyền `admin` / `user`.
- [x] Username không dấu và bắt đổi mật khẩu lần đầu.
- [x] Ngân hàng đề C/C++, ví dụ, gợi ý và test case riêng tư.
- [x] Bài giảng theo tuần và tài liệu trong private Storage.
- [x] `courses`, `course_classes`, `course_members`.
- [x] Mỗi tuần học thuộc một khóa học.
- [x] `assignments` tổng quát cho coding, file và text/file.
- [x] Một đề coding có thể được dùng lại trong nhiều bài giao/lớp.
- [x] `submission_files` và private bucket `assignment-submissions`.
- [x] Chuyển dữ liệu `problems` và `submissions` cũ mà không xóa dữ liệu.
- [x] Upload trực tiếp từ trình duyệt tới Supabase Storage, phù hợp với Vercel.
- [x] Review thủ công, điểm số và nhận xét.
- [x] Dashboard học viên theo khóa/lớp.
- [x] Quản lý bài giao theo khóa học, tuần và tiến độ nộp bài.
- [x] Popup tạo/sửa bài giao; toàn bộ slug được sinh tự động và ẩn khỏi giao diện.
- [x] Ngân hàng đề coding riêng theo từng khóa học.
- [x] Bảng tổng kết admin và lọc theo lớp.
- [x] RLS giới hạn nội dung theo membership.
- [x] Đổi thương hiệu giao diện thành `LearnHub`.
- [x] Sidebar responsive và vùng nội dung rộng dùng chung toàn hệ thống.

## Việc cần làm trước production

- [ ] Chạy migration `004`, `005`, `006`, `007` trên Supabase production.
- [ ] Chạy truy vấn kiểm tra cuối README và xác nhận đủ 7 tài khoản học viên.
- [ ] Kiểm tra thủ công một vòng bằng tài khoản admin và một tài khoản học viên.
- [ ] Cấu hình biến môi trường trên Vercel và deploy commit mới nhất.
- [ ] Đổi các mật khẩu tạm đã phát cho học viên.

## Ưu tiên tiếp theo

### P1 — Vận hành lớp học

- Sửa/xóa bài giao tổng quát sau khi tạo.
- Đóng nộp bài theo hạn và cho phép gia hạn theo học viên.
- Thông báo khi có bài mới, gần đến hạn hoặc đã được review.
- Xuất bảng điểm CSV/XLSX theo lớp.

### P2 — Nội dung và đánh giá

- Cho phép câu trả lời text thực sự thay vì chỉ file.
- Rubric chấm điểm theo tiêu chí.
- Phiên bản hóa bài giảng và bài giao.
- Theo dõi bài giảng đã xem và tài liệu đã tải.

### P3 — Chạy code an toàn

- Giữ production hiện tại ở chế độ upload/review thủ công.
- Nếu cần auto-judge, triển khai worker sandbox riêng thay vì chạy compiler trong Vercel Function.
- Thêm hàng đợi, timeout, giới hạn CPU/RAM và test case ẩn trước khi mở cho học viên.

## Tiêu chí hoàn thành bản MVP

1. Admin tạo được khóa, lớp và thêm học viên.
2. Admin tạo tuần, bài giảng, tài liệu và bài giao.
3. Học viên chỉ thấy khóa/lớp mà mình tham gia.
4. Học viên nộp và tải lại file của chính mình.
5. Admin tải file, review, chấm đúng/sai và nhập điểm.
6. Dashboard và bảng tổng kết hiển thị đúng theo lớp.
7. Lint, production build và audit dependency production đều đạt.
