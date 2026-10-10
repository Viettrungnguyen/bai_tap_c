import Link from "next/link";
import { BarChart3, BookOpen, Code2, FileClock, LogOut, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/login/actions";

type AppShellProps = {
  children: React.ReactNode;
  email?: string;
  isAdmin?: boolean;
};

const links = [
  { href: "/dashboard", label: "Bài tập", icon: BookOpen, enabled: true },
  { href: "/submissions", label: "Bài đã nộp", icon: FileClock, enabled: true },
  { href: "/progress", label: "Tiến độ", icon: BarChart3, enabled: false },
];

export function AppShell({ children, email, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f7f2]">
      <header className="border-b border-slate-900/10 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-emerald-300">
              <Code2 size={19} />
            </span>
            C Lab
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                title="Đăng xuất"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[210px_1fr] lg:px-10">
        <aside>
          <nav className="flex gap-2 overflow-x-auto md:sticky md:top-8 md:flex-col">
            {links.map(({ href, label, icon: Icon, enabled }) =>
              enabled ? (
                <Link
                  key={href}
                  href={href}
                  className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                >
                  <Icon size={18} /> {label}
                </Link>
              ) : (
                <span
                  key={href}
                  title="Sẽ có trong phần triển khai tiếp theo"
                  className="flex shrink-0 cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400"
                >
                  <Icon size={18} /> {label}
                </span>
              ),
            )}
            {isAdmin ? (
              <Link
                href="/admin"
                className="flex shrink-0 items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ShieldCheck size={18} /> Quản trị
              </Link>
            ) : null}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
