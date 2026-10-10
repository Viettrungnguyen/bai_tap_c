import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Code2, LockKeyhole } from "lucide-react";

import { signIn, signUp } from "./actions";

export const metadata = { title: "Đăng nhập" };
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSignUp = params.mode === "signup";

  return (
    <main className="grid min-h-screen bg-[#f6f7f2] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col p-5 sm:p-10 lg:p-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} /> Về trang chủ
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-emerald-300">
              <Code2 size={22} />
            </span>
            <span className="text-xl font-semibold">LearnHub</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">
            {isSignUp ? "Tạo tài khoản" : "Chào mừng trở lại"}
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            {isSignUp
              ? "Bắt đầu học, nhận bài và theo dõi tiến độ của bạn."
              : "Đăng nhập để tiếp tục bài tập đang làm."}
          </p>

          <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                !isSignUp ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              Đăng nhập
            </Link>
            <Link
              href="/login?mode=signup"
              className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                isSignUp ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              }`}
            >
              Đăng ký
            </Link>
          </div>

          {params.error ? (
            <div className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{params.error}</span>
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>{params.message}</span>
            </div>
          ) : null}

          <form action={isSignUp ? signUp : signIn} className="mt-6 space-y-5">
            {isSignUp ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên</span>
                <input
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Nguyễn Văn A"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                {isSignUp ? "Email" : "Tên đăng nhập hoặc email"}
              </span>
              <input
                name={isSignUp ? "email" : "identifier"}
                type={isSignUp ? "email" : "text"}
                autoComplete={isSignUp ? "email" : "username"}
                required
                placeholder={isSignUp ? "ban@example.com" : "nguyenducmanh"}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</span>
              <input
                name="password"
                type="password"
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                placeholder="Tối thiểu 8 ký tự"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <LockKeyhole size={18} />
              {isSignUp ? "Tạo tài khoản" : "Đăng nhập"}
            </button>
          </form>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(52,211,153,0.28),transparent_35%),linear-gradient(135deg,transparent_40%,rgba(16,185,129,0.08))]" />
        <div className="relative max-w-xl">
          <div className="mb-10 grid w-fit grid-cols-4 gap-2 opacity-60">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-sm ${index % 3 === 0 ? "bg-emerald-300" : "bg-slate-600"}`}
              />
            ))}
          </div>
          <blockquote className="text-4xl font-medium leading-tight tracking-[-0.04em]">
            “Code tốt bắt đầu từ một vòng lặp nhỏ: viết, chạy, hiểu lỗi và thử lại.”
          </blockquote>
          <p className="mt-7 text-slate-400">Không gian học tập chung cho mọi môn học.</p>
        </div>
      </aside>
    </main>
  );
}
