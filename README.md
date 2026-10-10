# LearnHub

LearnHub là nền tảng quản lý khóa học, lớp học, bài giảng, bài giao, file bài làm và tiến độ học viên. Hệ thống hỗ trợ nhiều môn; module đề C/C++ cũ được giữ lại để chuyển đổi dữ liệu an toàn.

Xem lộ trình tiếp theo tại [PLAN.md](./PLAN.md).

## Chức năng hiện có

### Học viên

- Đăng nhập bằng username không dấu hoặc email.
- Bắt buộc đổi mật khẩu tạm trong lần đăng nhập đầu tiên.
- Xem bài giảng và tài liệu theo khóa, lớp, tuần.
- Xem bài được giao theo khóa/lớp.
- Nộp một hoặc nhiều file theo định dạng và dung lượng admin cấu hình.
- Xem lịch sử, tải lại file, điểm và nhận xét review.
- Xem đề coding, ví dụ và gợi ý khi assignment liên kết với `problems`.

### Admin

- Tạo khóa học và lớp học.
- Thêm học viên hoặc giảng viên vào lớp.
- Tạo tuần học, bài giảng Markdown và tài liệu đính kèm.
- Tạo bài giao loại `coding`, `file` hoặc `text`.
- Giới hạn đuôi file, số file và dung lượng mỗi file.
- Quản lý ngân hàng đề C/C++, ví dụ, gợi ý và test case.
- Tải file bài làm, review thủ công, nhập điểm và nhận xét.
- Xem tổng kết toàn bộ học viên hoặc lọc theo lớp.
- Xem chi tiết trạng thái từng bài: chưa làm, chờ chấm, chưa đúng, đúng.

## Kiến trúc

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS.
- Supabase Auth, Postgres, Row Level Security và private Storage.
- Vercel chạy ứng dụng web.
- File được upload trực tiếp từ trình duyệt tới Supabase Storage, không đi qua Vercel Function.
- Production hiện không biên dịch hoặc chạy code C/C++; admin review file thủ công.

Các bảng chính:

```text
profiles
courses
course_classes
course_members
course_weeks
lessons
lesson_resources
assignments
problems                 # ngân hàng đề coding cũ, vẫn được giữ
submissions
submission_files
```

Private buckets:

```text
lesson-resources
assignment-submissions
```

## Cài đặt local

Yêu cầu Node.js 20 trở lên.

```bash
npm install
```

Tạo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Không đặt Supabase secret/service-role key trong biến có tiền tố `NEXT_PUBLIC_` và không commit `.env.local`.

Chạy ứng dụng:

```bash
npm run dev
```

Mở <http://localhost:3000>.

## SQL cần chạy trên Supabase

### Database mới hoàn toàn

Mở Supabase Dashboard → SQL Editor và chạy từng file, đúng thứ tự, mỗi file một lần:

```text
1. supabase/migrations/001_auth_and_profiles.sql
2. supabase/migrations/002_problems.sql
3. supabase/migrations/003_submissions.sql
4. supabase/migrations/004_course_content.sql
5. supabase/migrations/005_student_usernames.sql
6. supabase/seeds/001_week_01_exercises.sql       # tùy chọn
7. supabase/migrations/006_courses_classes_assignments.sql
```

Nếu dùng seed bài C mẫu, phải chạy seed trước migration `006` để các `problems` mẫu được chuyển thành assignment coding tự động.

### Supabase hiện tại của dự án

Các migration `001`–`003` đã có. Chạy tiếp:

```text
1. supabase/migrations/004_course_content.sql
2. supabase/migrations/005_student_usernames.sql
3. supabase/seeds/001_week_01_exercises.sql       # tùy chọn, chạy tại đây
4. supabase/migrations/006_courses_classes_assignments.sql
```

Không chạy lại migration đã thành công vì các migration được thiết kế chạy tuần tự một lần.

Migration `006` sẽ tự động:

- Tạo khóa `Lập trình C/C++` và `Lớp mặc định`.
- Gắn các tuần học hiện có vào khóa mặc định.
- Thêm tài khoản hiện có vào lớp mặc định.
- Chuyển mỗi `problem` hiện có thành một assignment coding.
- Gắn các `submissions` cũ với assignment tương ứng.
- Tạo bucket `assignment-submissions`.
- Áp dụng RLS theo khóa/lớp cho bài giảng, bài giao, đề và file.

### Kiểm tra sau khi chạy SQL

Chạy trong SQL Editor:

```sql
select id, title, slug, status from public.courses order by created_at;

select
  course_classes.name as class_name,
  count(course_members.id) as member_count
from public.course_classes
left join public.course_members
  on course_members.class_id = course_classes.id
group by course_classes.id, course_classes.name
order by course_classes.name;

select assignment_type, status, count(*)
from public.assignments
group by assignment_type, status
order by assignment_type, status;

select id, name, public, file_size_limit
from storage.buckets
where id in ('lesson-resources', 'assignment-submissions');

select username, full_name, school, major, must_change_password
from public.profiles
where role = 'user'
order by full_name;
```

Kết quả mong đợi:

- Có ít nhất một course và một class.
- Lớp mặc định có các tài khoản học viên hiện tại.
- Các đề C/C++ cũ xuất hiện trong `assignments` với loại `coding`.
- Hai bucket đều có `public = false`.
- Bảy học viên có username, trường và ngành sau khi migration `005` backfill metadata.

## Tạo admin đầu tiên

Sau khi tài khoản admin đã tồn tại trong Supabase Auth:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

## Quy trình sử dụng sau migration

1. Đăng nhập admin.
2. Vào `/admin/courses` để kiểm tra khóa và lớp mặc định.
3. Thêm hoặc chuyển học viên vào lớp phù hợp.
4. Vào `/admin/course` để tạo tuần và bài giảng.
5. Vào `/admin/assignments` để tạo/xuất bản bài giao.
6. Đăng nhập bằng một tài khoản học viên để kiểm tra dashboard và nộp file.
7. Quay lại `/admin/submissions` để review.
8. Kiểm tra `/admin/users` và bộ lọc theo lớp.

## Deploy Vercel

Thiết lập hai biến môi trường sau cho Production, Preview và Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Sau đó import repository GitHub vào Vercel. Root Directory là `web` nếu repository chứa thư mục cha; nếu repository hiện tại bắt đầu trực tiếp từ project Next.js thì để mặc định.

## Kiểm tra trước khi push/deploy

```bash
npm run lint
npm run build
npm audit --omit=dev
git diff --check
```

## Giới hạn hiện tại

- Không chạy code hoặc auto-judge trên production.
- Chấm bài thủ công bởi admin.
- Assignment loại `text` hiện nhận file; ô trả lời văn bản trực tiếp nằm trong kế hoạch tiếp theo.
- Migration production cần chạy thủ công trong Supabase SQL Editor vì publishable/secret project key không có quyền DDL.
