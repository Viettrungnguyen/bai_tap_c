import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";

const features = [
  {
    icon: TerminalSquare,
    title: "Bài giảng theo khóa học",
    description:
      "Tổ chức bài giảng theo khóa, lớp và tuần học để học viên theo dõi dễ dàng.",
  },
  {
    icon: CheckCircle2,
    title: "Nộp mọi loại bài tập",
    description:
      "Nhận bài coding, tài liệu, project và lưu file an toàn trong kho riêng tư.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến độ",
    description:
      "Quan sát số bài đã làm, kết quả đúng sai và tiến độ của từng học viên.",
  },
];

const stats = [
  ["C · SQL · Java", "Mở rộng nhiều môn"],
  ["3", "Loại bài giao"],
  ["2", "Vai trò hệ thống"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f2] text-slate-950">
      <SiteHeader />

      <section className="relative border-b border-slate-900/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(52,211,153,0.20),transparent_30%),radial-gradient(circle_at_15%_65%,rgba(59,130,246,0.10),transparent_35%)]" />
        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
              <Sparkles size={15} />
              Học lập trình bằng cách thực hành
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Học liệu tập trung.
              <span className="block text-emerald-700">Giao bài. Theo dõi.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Không gian học tập cho nhiều môn: bài giảng theo tuần, bài giao rõ ràng,
              nộp file riêng tư và theo dõi tiến độ theo từng lớp.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Bắt đầu làm bài <ArrowRight size={18} />
              </Link>
              <a
                href="#tinh-nang"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white/70 px-6 font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-white"
              >
                Xem tính năng
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rotate-2 rounded-[2rem] bg-emerald-300/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-800/20 bg-[#111827] shadow-2xl shadow-slate-900/20">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-xs text-slate-400">main.c</span>
              </div>
              <div className="grid min-h-[370px] grid-cols-[42px_1fr] font-mono text-[13px] leading-7 sm:text-sm">
                <div className="select-none border-r border-white/10 bg-black/15 py-6 text-center text-slate-600">
                  1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9
                </div>
                <pre className="overflow-x-auto p-6 text-slate-300">
                  <code>
                    <span className="text-fuchsia-300">#include</span>{" "}
                    <span className="text-emerald-300">&lt;stdio.h&gt;</span>
                    {"\n\n"}
                    <span className="text-sky-300">int</span>{" "}
                    <span className="text-amber-200">main</span>() {"{"}
                    {"\n  "}<span className="text-sky-300">int</span> a, b;
                    {"\n  "}<span className="text-amber-200">scanf</span>(
                    <span className="text-emerald-300">&quot;%d%d&quot;</span>, &amp;a, &amp;b);
                    {"\n  "}<span className="text-amber-200">printf</span>(
                    <span className="text-emerald-300">&quot;%d\n&quot;</span>, a + b);
                    {"\n  "}<span className="text-fuchsia-300">return</span> 0;
                    {"\n}"}
                  </code>
                </pre>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-5 py-4">
                <span className="text-sm text-slate-400">Kết quả gần nhất</span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-400/15 px-3 py-1.5 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 size={16} /> Accepted
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tinh-nang" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
            Một quy trình liền mạch
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Từ đề bài đến kết quả, không bị ngắt quãng.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-900/10 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Icon size={22} />
                </span>
                <span className="font-mono text-sm text-slate-400">0{index + 1}</span>
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-900/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 lg:px-10">
          {stats.map(([value, label]) => (
            <div key={label} className="border-l-2 border-emerald-500 pl-5">
              <div className="text-2xl font-semibold tracking-tight">{value}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
        <div className="rounded-3xl bg-emerald-700 p-8 text-white sm:p-10">
          <Users size={30} />
          <h2 className="mt-8 text-3xl font-semibold tracking-tight">Dành cho học viên</h2>
          <p className="mt-4 max-w-lg text-lg leading-8 text-emerald-50/80">
            Tập trung vào cách giải. Hệ thống giữ lại code, lịch sử bài nộp và chỉ ra
            đúng loại lỗi cần xử lý.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
          <ShieldCheck size={30} className="text-emerald-400" />
          <h2 className="mt-8 text-3xl font-semibold tracking-tight">Dành cho quản trị viên</h2>
          <p className="mt-4 max-w-lg text-lg leading-8 text-slate-300">
            Quản lý khóa, lớp, bài giảng, bài giao và xem nhanh ai đã làm,
            bài nào còn thiếu hoặc cần review.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-900/10 px-5 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
            <Code2 size={17} /> LearnHub
          </span>
          <span>Nền tảng học liệu và bài tập cho lớp học.</span>
        </div>
      </footer>
    </main>
  );
}
