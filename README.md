# C Lab

Website nộp và chấm bài tập C/C++ cho lớp học.

## Trạng thái triển khai

### Phần 1 — Nền tảng và xác thực

- Next.js App Router, TypeScript và Tailwind CSS.
- Trang giới thiệu responsive.
- Đăng ký, đăng nhập và đăng xuất với Supabase Auth.
- Hồ sơ và hai role `admin`, `user`.
- Bảo vệ route và kiểm tra quyền ở server.
- Migration tạo `profiles`, trigger và RLS.

### Phần 2 — Quản lý bài tập

- Admin tạo, sửa, xóa và xuất bản bài tập.
- Cấu hình độ khó, thời gian, bộ nhớ và ngôn ngữ.
- CRUD ví dụ input/output.
- CRUD gợi ý.
- CRUD test case và expected output.
- RLS ngăn user truy cập test case.
- Dashboard user hiển thị bài đã xuất bản.
- Trang chi tiết đề, ví dụ và gợi ý.

Phần tiếp theo: Monaco Editor, chạy thử C/C++ và tích hợp Judge0.

## Chạy local

1. Tạo một project trên Supabase.
2. Chạy lần lượt các migration trong Supabase SQL Editor:

```text
supabase/migrations/001_auth_and_profiles.sql
supabase/migrations/002_problems.sql
```

3. Sao chép `.env.example` thành `.env.local` và điền thông tin Supabase.
4. Chạy:

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Tạo tài khoản admin đầu tiên

Đăng ký tài khoản qua giao diện, sau đó chạy trong Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Không đưa `SUPABASE_SECRET_KEY` hoặc `JUDGE0_API_KEY` vào biến có tiền tố
`NEXT_PUBLIC_`.

## Kiểm tra trước khi deploy

```bash
npm run lint
npm run build
```
