-- Seed 10 C exercises from week 01, lessons 01 and 02.
-- Prerequisites: migrations 001, 002 and 003; at least one profile with role = 'admin'.
-- Safe to run again: problems are upserted by slug and their seed-owned children are rebuilt.

begin;

create temporary table week_01_seed_slugs (
  slug text primary key
) on commit drop;

insert into week_01_seed_slugs (slug)
values
  ('tuan-01-bai-01-du-doan-phep-toan'),
  ('tuan-01-bai-02-doi-thoi-gian-sang-giay'),
  ('tuan-01-bai-03-chia-hang-vao-thung'),
  ('tuan-01-bai-04-sua-loi-tinh-dien-tich'),
  ('tuan-01-bai-05-uoc-tinh-chuyen-xe'),
  ('tuan-01-bai-06-doi-nhiet-do'),
  ('tuan-01-bai-07-tinh-diem-trung-binh'),
  ('tuan-01-bai-08-tinh-gia-tri-don-hang'),
  ('tuan-01-bai-09-sua-loi-chia-so-nguyen'),
  ('tuan-01-bai-10-may-tinh-luong');

do $$
declare
  v_admin_id uuid;
begin
  select id
  into v_admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if v_admin_id is null then
    raise exception 'Không tìm thấy tài khoản admin. Hãy đăng ký tài khoản và cập nhật profiles.role = admin trước khi chạy seed.';
  end if;

  insert into public.problems (
    title,
    slug,
    description,
    input_description,
    output_description,
    difficulty,
    time_limit_ms,
    memory_limit_kb,
    allowed_languages,
    status,
    created_by
  )
  select
    seed.title,
    seed.slug,
    seed.description,
    seed.input_description,
    seed.output_description,
    seed.difficulty::public.problem_difficulty,
    1000,
    131072,
    array['c11']::text[],
    'published'::public.problem_status,
    v_admin_id
  from (
    values
      (
        'Tuần 1.1 — Dự đoán phép toán số nguyên',
        'tuan-01-bai-01-du-doan-phep-toan',
        $text$Cho hai biến nguyên a = 17 và b = 5. Viết chương trình in lần lượt kết quả của a + b, a / b và a % b, mỗi kết quả trên một dòng.

Sau khi hoàn thành, hãy chắc chắn rằng bạn có thể giải thích vì sao phép chia số nguyên cho kết quả 3 và phép chia lấy dư cho kết quả 2.$text$,
        'Bài này không có dữ liệu nhập. Khai báo trực tiếp a = 17 và b = 5 trong chương trình.',
        'In đúng ba dòng, lần lượt là tổng, thương nguyên và phần dư.',
        'easy'
      ),
      (
        'Tuần 1.1 — Đổi thời gian sang giây',
        'tuan-01-bai-02-doi-thoi-gian-sang-giay',
        $text$Tạo chương trình dùng bốn biến hours, minutes, seconds và total_seconds để tính tổng số giây.

Với dữ liệu 2 giờ, 15 phút, 20 giây, áp dụng công thức:
tổng giây = giờ × 3600 + phút × 60 + giây.$text$,
        'Bài này không có dữ liệu nhập. Khởi tạo hours = 2, minutes = 15 và seconds = 20.',
        $text$In bốn dòng theo đúng định dạng:
Gio: <hours>
Phut: <minutes>
Giay: <seconds>
Tong giay: <total_seconds>$text$,
        'easy'
      ),
      (
        'Tuần 1.1 — Chia hàng vào thùng',
        'tuan-01-bai-03-chia-hang-vao-thung',
        $text$Cửa hàng có 137 sản phẩm. Mỗi thùng chứa tối đa 12 sản phẩm.

Hãy tính số thùng đầy, số sản phẩm còn dư và số thùng tối thiểu cần chuẩn bị để đóng gói tất cả sản phẩm.$text$,
        'Bài này không có dữ liệu nhập. Dùng total_products = 137 và capacity = 12.',
        $text$In ba dòng theo đúng định dạng:
Thung day: <số thùng đầy>
San pham du: <số sản phẩm dư>
Tong so thung: <số thùng tối thiểu>$text$,
        'easy'
      ),
      (
        'Tuần 1.1 — Sửa lỗi tính diện tích',
        'tuan-01-bai-04-sua-loi-tinh-dien-tich',
        $text$Đoạn chương trình ban đầu có các lỗi như thiếu dấu chấm phẩy, sai tên biến và thiếu dấu phẩy trong printf. Hãy viết lại chương trình C hoàn chỉnh để tính diện tích hình chữ nhật có width = 8 và height = 5.

Chương trình phải biên dịch sạch warning với chuẩn C11.$text$,
        'Bài này không có dữ liệu nhập. Khai báo width = 8 và height = 5.',
        'In một dòng theo định dạng: Dien tich: <area>',
        'easy'
      ),
      (
        'Tuần 1.1 — Ước tính số chuyến xe',
        'tuan-01-bai-05-uoc-tinh-chuyen-xe',
        $text$Viết chương trình ước tính số chuyến xe cần dùng để chở 95 kiện hàng, biết mỗi xe chở tối đa 20 kiện.

Chương trình phải hiển thị số chuyến đầy, số kiện ở chuyến cuối và tổng số chuyến cần dùng.$text$,
        'Bài này không có dữ liệu nhập. Dùng packages = 95 và capacity = 20.',
        $text$In ba dòng theo đúng định dạng:
Chuyen day: <số chuyến đầy>
Kien chuyen cuoi: <số kiện còn lại>
Tong so chuyen: <tổng số chuyến>$text$,
        'easy'
      ),
      (
        'Tuần 1.2 — Đổi độ C sang độ F',
        'tuan-01-bai-06-doi-nhiet-do',
        $text$Nhập nhiệt độ theo độ C và đổi sang độ F theo công thức:
F = C × 9 / 5 + 32

Dùng kiểu double, kiểm tra kết quả trả về của scanf và tránh lỗi chia số nguyên.$text$,
        'Một số thực C biểu diễn nhiệt độ theo độ C.',
        'In nhiệt độ F với đúng một chữ số sau dấu thập phân theo định dạng: F: <giá trị>',
        'easy'
      ),
      (
        'Tuần 1.2 — Tính điểm trung bình',
        'tuan-01-bai-07-tinh-diem-trung-binh',
        $text$Nhập điểm của ba môn và tính điểm trung bình.

Mỗi điểm phải nằm trong đoạn từ 0 đến 10. Nếu đọc sai kiểu hoặc có điểm ngoài phạm vi, in Du lieu khong hop le. và kết thúc chương trình với mã lỗi khác 0.$text$,
        'Ba số thực lần lượt là điểm của ba môn, nằm trên cùng một dòng.',
        'Nếu hợp lệ, in theo định dạng Trung binh: <giá trị> với hai chữ số sau dấu thập phân. Nếu không hợp lệ, in Du lieu khong hop le.',
        'easy'
      ),
      (
        'Tuần 1.2 — Tính giá trị đơn hàng',
        'tuan-01-bai-08-tinh-gia-tri-don-hang',
        $text$Nhập đơn giá sản phẩm, số lượng và phần trăm giảm giá. Tính tạm tính, số tiền được giảm và tổng tiền sau giảm.

Không chấp nhận đơn giá âm, số lượng âm hoặc phần trăm giảm giá nằm ngoài đoạn 0–100. Dữ liệu không hợp lệ phải được phát hiện và báo lỗi.$text$,
        'Một số thực là đơn giá, một số nguyên là số lượng và một số thực là phần trăm giảm giá, nằm trên cùng một dòng.',
        $text$Nếu hợp lệ, in ba dòng với hai chữ số sau dấu thập phân:
Tam tinh: <giá trị>
Giam gia: <giá trị>
Tong: <giá trị>
Nếu không hợp lệ, in Du lieu khong hop le.$text$,
        'medium'
      ),
      (
        'Tuần 1.2 — Sửa lỗi chia số nguyên',
        'tuan-01-bai-09-sua-loi-chia-so-nguyen',
        $text$Chương trình có total = 25, count = 4 và cần tính trung bình dưới dạng số thực. Nếu viết double average = total / count thì kết quả bị mất phần thập phân.

Hãy sửa chương trình bằng một trong hai cách: ép kiểu một toán hạng sang double hoặc dùng phép chia với một toán hạng số thực.$text$,
        'Bài này không có dữ liệu nhập. Dùng total = 25 và count = 4.',
        'In một dòng theo định dạng Trung binh: <average>, với hai chữ số sau dấu thập phân.',
        'easy'
      ),
      (
        'Tuần 1.2 — Máy tính lương đơn giản',
        'tuan-01-bai-10-may-tinh-luong',
        $text$Nhập số giờ làm và lương mỗi giờ. Tính tổng lương trước thuế, thuế giả lập 10% và lương thực nhận.

Số giờ phải nằm trong đoạn 0–300 và lương mỗi giờ không được âm. Phiên bản này chưa tính lương tăng ca.$text$,
        'Hai số thực lần lượt là số giờ làm và lương mỗi giờ, nằm trên cùng một dòng.',
        $text$Nếu hợp lệ, in ba dòng với hai chữ số sau dấu thập phân:
Luong truoc thue: <giá trị>
Thue: <giá trị>
Luong thuc nhan: <giá trị>
Nếu không hợp lệ, in Du lieu khong hop le.$text$,
        'medium'
      )
  ) as seed(title, slug, description, input_description, output_description, difficulty)
  on conflict (slug) do update
  set
    title = excluded.title,
    description = excluded.description,
    input_description = excluded.input_description,
    output_description = excluded.output_description,
    difficulty = excluded.difficulty,
    time_limit_ms = excluded.time_limit_ms,
    memory_limit_kb = excluded.memory_limit_kb,
    allowed_languages = excluded.allowed_languages,
    status = excluded.status;
end;
$$;

-- Rebuild examples, hints and private tests belonging to this seed.
delete from public.problem_examples
where problem_id in (
  select p.id
  from public.problems p
  join week_01_seed_slugs seed on seed.slug = p.slug
);

delete from public.problem_hints
where problem_id in (
  select p.id
  from public.problems p
  join week_01_seed_slugs seed on seed.slug = p.slug
);

delete from public.test_cases
where problem_id in (
  select p.id
  from public.problems p
  join week_01_seed_slugs seed on seed.slug = p.slug
);

insert into public.problem_examples (problem_id, input, output, explanation, sort_order)
select p.id, seed.input_text, seed.output_text, seed.explanation, seed.sort_order
from public.problems p
join (
  values
    ('tuan-01-bai-01-du-doan-phep-toan', '', E'22\n3\n2', '17 + 5 = 22; phép chia int 17 / 5 = 3; phần dư 17 % 5 = 2.', 0),
    ('tuan-01-bai-02-doi-thoi-gian-sang-giay', '', E'Gio: 2\nPhut: 15\nGiay: 20\nTong giay: 8120', '2 × 3600 + 15 × 60 + 20 = 8120.', 0),
    ('tuan-01-bai-03-chia-hang-vao-thung', '', E'Thung day: 11\nSan pham du: 5\nTong so thung: 12', '137 / 12 = 11 dư 5, do đó cần thêm một thùng.', 0),
    ('tuan-01-bai-04-sua-loi-tinh-dien-tich', '', 'Dien tich: 40', 'Diện tích bằng 8 × 5.', 0),
    ('tuan-01-bai-05-uoc-tinh-chuyen-xe', '', E'Chuyen day: 4\nKien chuyen cuoi: 15\nTong so chuyen: 5', '95 / 20 = 4 dư 15, vì còn dư nên tổng cộng cần 5 chuyến.', 0),
    ('tuan-01-bai-06-doi-nhiet-do', '0', 'F: 32.0', '0 độ C tương ứng 32 độ F.', 0),
    ('tuan-01-bai-06-doi-nhiet-do', '-40', 'F: -40.0', '-40 là giá trị mà thang C và F bằng nhau.', 1),
    ('tuan-01-bai-07-tinh-diem-trung-binh', '8 7 9', 'Trung binh: 8.00', 'Tổng ba điểm là 24, chia cho 3 bằng 8.', 0),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', '100000 2 10', E'Tam tinh: 200000.00\nGiam gia: 20000.00\nTong: 180000.00', 'Tạm tính 200000, giảm 10% là 20000.', 0),
    ('tuan-01-bai-09-sua-loi-chia-so-nguyen', '', 'Trung binh: 6.25', 'Ép total sang double trước khi chia để giữ phần thập phân.', 0),
    ('tuan-01-bai-10-may-tinh-luong', '160 50000', E'Luong truoc thue: 8000000.00\nThue: 800000.00\nLuong thuc nhan: 7200000.00', 'Thuế bằng 10% lương trước thuế.', 0)
) as seed(slug, input_text, output_text, explanation, sort_order)
  on p.slug = seed.slug;

insert into public.problem_hints (problem_id, content, sort_order)
select p.id, seed.content, seed.sort_order
from public.problems p
join (
  values
    ('tuan-01-bai-01-du-doan-phep-toan', 'Khi cả hai toán hạng là int, phép chia / chỉ giữ phần nguyên; toán tử % trả về phần dư.', 0),
    ('tuan-01-bai-02-doi-thoi-gian-sang-giay', 'Tính riêng hours * 3600 và minutes * 60, sau đó cộng seconds.', 0),
    ('tuan-01-bai-03-chia-hang-vao-thung', 'Dùng / để tìm số thùng đầy và % để tìm số sản phẩm dư. Nếu số dư lớn hơn 0 thì cần thêm một thùng.', 0),
    ('tuan-01-bai-04-sua-loi-tinh-dien-tich', 'Kiểm tra lần lượt dấu ;, chính tả tên biến height và dấu phẩy ngăn cách chuỗi định dạng với đối số printf.', 0),
    ('tuan-01-bai-05-uoc-tinh-chuyen-xe', 'Bài toán giống phép chia có dư: packages / capacity và packages % capacity.', 0),
    ('tuan-01-bai-06-doi-nhiet-do', 'Viết 9.0 / 5.0 để phép chia được thực hiện dưới dạng số thực.', 0),
    ('tuan-01-bai-07-tinh-diem-trung-binh', 'Kiểm tra scanf đọc đủ ba giá trị và kiểm tra từng điểm bằng điều kiện score < 0 || score > 10.', 0),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', 'discount_amount = subtotal * discount_percent / 100.0; total = subtotal - discount_amount.', 0),
    ('tuan-01-bai-09-sua-loi-chia-so-nguyen', 'Có thể viết (double) total / count hoặc total / 4.0.', 0),
    ('tuan-01-bai-10-may-tinh-luong', 'gross = hours * hourly_rate; tax = gross * 0.10; net = gross - tax.', 0)
) as seed(slug, content, sort_order)
  on p.slug = seed.slug;

insert into public.test_cases (
  problem_id,
  input,
  expected_output,
  is_sample,
  score,
  sort_order
)
select
  p.id,
  seed.input_text,
  seed.expected_output,
  seed.is_sample,
  seed.score,
  seed.sort_order
from public.problems p
join (
  values
    ('tuan-01-bai-01-du-doan-phep-toan', '', E'22\n3\n2', true, 100.00, 0),
    ('tuan-01-bai-02-doi-thoi-gian-sang-giay', '', E'Gio: 2\nPhut: 15\nGiay: 20\nTong giay: 8120', true, 100.00, 0),
    ('tuan-01-bai-03-chia-hang-vao-thung', '', E'Thung day: 11\nSan pham du: 5\nTong so thung: 12', true, 100.00, 0),
    ('tuan-01-bai-04-sua-loi-tinh-dien-tich', '', 'Dien tich: 40', true, 100.00, 0),
    ('tuan-01-bai-05-uoc-tinh-chuyen-xe', '', E'Chuyen day: 4\nKien chuyen cuoi: 15\nTong so chuyen: 5', true, 100.00, 0),
    ('tuan-01-bai-06-doi-nhiet-do', '0', 'F: 32.0', true, 25.00, 0),
    ('tuan-01-bai-06-doi-nhiet-do', '37', 'F: 98.6', false, 25.00, 1),
    ('tuan-01-bai-06-doi-nhiet-do', '100', 'F: 212.0', false, 25.00, 2),
    ('tuan-01-bai-06-doi-nhiet-do', '-40', 'F: -40.0', false, 25.00, 3),
    ('tuan-01-bai-07-tinh-diem-trung-binh', '8 7 9', 'Trung binh: 8.00', true, 25.00, 0),
    ('tuan-01-bai-07-tinh-diem-trung-binh', '10 10 10', 'Trung binh: 10.00', false, 25.00, 1),
    ('tuan-01-bai-07-tinh-diem-trung-binh', '0 0 0', 'Trung binh: 0.00', false, 25.00, 2),
    ('tuan-01-bai-07-tinh-diem-trung-binh', '8 11 9', 'Du lieu khong hop le.', false, 25.00, 3),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', '100000 2 10', E'Tam tinh: 200000.00\nGiam gia: 20000.00\nTong: 180000.00', true, 25.00, 0),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', '50000 0 15', E'Tam tinh: 0.00\nGiam gia: 0.00\nTong: 0.00', false, 25.00, 1),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', '25000 4 0', E'Tam tinh: 100000.00\nGiam gia: 0.00\nTong: 100000.00', false, 25.00, 2),
    ('tuan-01-bai-08-tinh-gia-tri-don-hang', '-1 2 10', 'Du lieu khong hop le.', false, 25.00, 3),
    ('tuan-01-bai-09-sua-loi-chia-so-nguyen', '', 'Trung binh: 6.25', true, 100.00, 0),
    ('tuan-01-bai-10-may-tinh-luong', '160 50000', E'Luong truoc thue: 8000000.00\nThue: 800000.00\nLuong thuc nhan: 7200000.00', true, 50.00, 0),
    ('tuan-01-bai-10-may-tinh-luong', '0 50000', E'Luong truoc thue: 0.00\nThue: 0.00\nLuong thuc nhan: 0.00', false, 25.00, 1),
    ('tuan-01-bai-10-may-tinh-luong', '301 50000', 'Du lieu khong hop le.', false, 25.00, 2)
) as seed(slug, input_text, expected_output, is_sample, score, sort_order)
  on p.slug = seed.slug;

commit;

-- Verification query: should return 10 rows.
select
  p.slug,
  p.title,
  p.status,
  count(distinct e.id) as examples,
  count(distinct h.id) as hints,
  count(distinct t.id) as test_cases
from public.problems p
left join public.problem_examples e on e.problem_id = p.id
left join public.problem_hints h on h.problem_id = p.id
left join public.test_cases t on t.problem_id = p.id
where p.slug like 'tuan-01-bai-%'
group by p.id, p.slug, p.title, p.status
order by p.slug;
