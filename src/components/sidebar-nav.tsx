"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookCopy,
  BookOpenText,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Code2,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  Users,
  X,
} from "lucide-react";

import { signOut } from "@/app/login/actions";

type SidebarNavProps = {
  email?: string;
  isAdmin?: boolean;
};

const learnerLinks = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/lessons", label: "Bài giảng", icon: BookOpenText },
  { href: "/submissions", label: "Bài đã nộp", icon: FileClock },
];

const adminLinks = [
  { href: "/admin", label: "Bảng điều khiển", icon: PanelsTopLeft, exact: true },
  { href: "/admin/courses", label: "Khóa học & lớp", icon: GraduationCap },
  { href: "/admin/course", label: "Tuần & bài giảng", icon: BookCopy },
  { href: "/admin/assignments", label: "Quản lý bài giao", icon: ClipboardList },
  { href: "/admin/problems", label: "Ngân hàng đề", icon: Code2 },
  { href: "/admin/submissions", label: "Review bài nộp", icon: ClipboardCheck },
  { href: "/admin/users", label: "Học viên & tiến độ", icon: Users },
];

export function SidebarNav({ email, isAdmin }: SidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navigation = (links: typeof learnerLinks | typeof adminLinks) =>
    links.map(({ href, label, icon: Icon, ...item }) => {
      const active = isActive(href, "exact" in item && Boolean(item.exact));
      return (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active
              ? "bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-950/10"
              : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
          <span className="flex-1">{label}</span>
          <ChevronRight
            size={15}
            className={`transition ${active ? "opacity-70" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"}`}
          />
        </Link>
      );
    });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-emerald-300">
            <Code2 size={18} />
          </span>
          LearnHub
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
        >
          <Menu size={20} />
        </button>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15">
              <Code2 size={20} />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">LearnHub</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Learning space</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Học tập</p>
            <nav className="space-y-1">{navigation(learnerLinks)}</nav>
          </div>

          {isAdmin ? (
            <div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quản trị</p>
              <nav className="space-y-1">{navigation(adminLinks)}</nav>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-sm font-bold text-emerald-300">
              {(email?.[0] || "U").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{email || "Tài khoản"}</p>
              <p className="mt-0.5 text-xs text-slate-400">{isAdmin ? "Quản trị viên" : "Học viên"}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={17} /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
