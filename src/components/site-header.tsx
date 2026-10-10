import Link from "next/link";
import { Code2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-slate-900/10 bg-[#f6f7f2]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-emerald-300">
            <Code2 size={19} />
          </span>
          <span className="text-lg">LearnHub</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
          >
            Đăng nhập
          </Link>
          <Link
            href="/login?mode=signup"
            className="hidden rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:block"
          >
            Tạo tài khoản
          </Link>
        </nav>
      </div>
    </header>
  );
}
