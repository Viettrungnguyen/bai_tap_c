import Link from "next/link";
import { ArrowRight, BookPlus, ClipboardCheck, Clock3, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Quản trị" };
export const instant = false;

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const actions = [
    {
      title: "Quản lý bài tập",
      description: "Tạo đề, test case, gợi ý và xuất bản bài.",
      href: "/admin/problems",
      icon: BookPlus,
      enabled: true,
    },
    {
      title: "Review bài nộp",
      description: "Xem source code, kết quả và ghi chú review.",
      href: "/admin/submissions",
      icon: ClipboardCheck,
      enabled: true,
    },
    {
      title: "Người dùng & tiến độ",
      description: "Xem bảng tổng kết và chi tiết từng học viên.",
      href: "/admin/users",
      icon: Users,
      enabled: true,
    },
  ];

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <p className="text-sm font-semibold text-emerald-700">KHU VỰC QUẢN TRỊ</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Điều hành lớp học</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Quản lý nội dung học tập, theo dõi bài nộp và tiến độ của học viên tại một nơi.
        </p>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {actions.map(({ title, description, href, icon: Icon, enabled }) => {
            const content = (
              <>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-emerald-300">
                  <Icon size={21} />
                </span>
                <h2 className="mt-6 text-xl font-semibold">{title}</h2>
                <p className="mt-2 min-h-14 leading-7 text-slate-500">{description}</p>
                {enabled ? (
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    Mở chức năng <ArrowRight size={16} />
                  </span>
                ) : (
                  <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                    <Clock3 size={14} /> Phần tiếp theo
                  </span>
                )}
              </>
            );

            return enabled ? (
              <Link
                key={title}
                href={href}
                className="group rounded-2xl border border-slate-900/10 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-slate-900/5"
              >
                {content}
              </Link>
            ) : (
              <article key={title} className="rounded-2xl border border-slate-900/10 bg-white p-6">
                {content}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
