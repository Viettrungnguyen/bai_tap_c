import { AlertCircle, KeyRound } from "lucide-react";

import { changeInitialPassword } from "@/app/change-password/actions";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Đổi mật khẩu" };
export const instant = false;

export default async function ChangePasswordPage({ searchParams }: PageProps<"/change-password">) {
  const [{ user, profile }, params] = await Promise.all([
    requireUser({ allowPasswordChange: true }),
    searchParams,
  ]);
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f2] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-900/10 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-emerald-300"><KeyRound size={22} /></span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">Tạo mật khẩu mới</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Chào {profile?.full_name || user.email}. Đây là lần đăng nhập đầu tiên, hãy đổi mật khẩu tạm trước khi tiếp tục.
        </p>

        {error ? <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 shrink-0" size={18} /> {error}</div> : null}

        <form action={changeInitialPassword} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới<input name="password" type="password" minLength={8} autoComplete="new-password" required className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label>
          <label className="block text-sm font-semibold text-slate-700">Nhập lại mật khẩu<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label>
          <p className="text-xs leading-5 text-slate-500">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</p>
          <SubmitButton pendingLabel="Đang cập nhật..." className="h-12 w-full rounded-xl bg-slate-950 font-semibold text-white hover:bg-emerald-700">Đổi mật khẩu và tiếp tục</SubmitButton>
        </form>
      </section>
    </main>
  );
}
