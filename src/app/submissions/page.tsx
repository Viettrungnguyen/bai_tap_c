import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileCode2, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { SubmissionStatus, SubmissionWithProblem } from "@/lib/types";

export const metadata = { title: "Bài đã nộp" };
export const instant = false;

const statusConfig: Record<
  SubmissionStatus,
  { label: string; icon: typeof Clock3; style: string }
> = {
  pending: { label: "Chờ review", icon: Clock3, style: "bg-amber-50 text-amber-700" },
  correct: { label: "Đúng", icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" },
  incorrect: { label: "Chưa đúng", icon: XCircle, style: "bg-rose-50 text-rose-700" },
};

export default async function SubmissionsPage() {
  const { supabase, user, profile } = await requireUser();
  const { data } = await supabase
    .from("submissions")
    .select("*, problems(title, slug)")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });
  const submissions = (data ?? []) as SubmissionWithProblem[];

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <section>
        <p className="text-sm font-semibold text-emerald-700">LỊCH SỬ</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Bài đã nộp</h1>
        <p className="mt-3 text-slate-600">
          Mỗi lần nộp được giữ nguyên file và source code để bạn có thể xem lại.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
          {submissions.length ? (
            <div className="divide-y divide-slate-100">
              {submissions.map((submission) => {
                const config = statusConfig[submission.status];
                const Icon = config.icon;
                return (
                  <Link
                    key={submission.id}
                    href={`/submissions/${submission.id}`}
                    className="group flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <FileCode2 size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">
                          {submission.problems?.title ?? "Bài tập đã xóa"}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {submission.file_name} · {submission.language === "c11" ? "C11" : "C++17"} · {formatDateTime(submission.submitted_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${config.style}`}>
                        <Icon size={14} /> {config.label}
                      </span>
                      <ArrowRight size={17} className="text-slate-400 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <FileCode2 size={23} />
              </span>
              <h2 className="mt-5 text-xl font-semibold">Bạn chưa nộp bài nào</h2>
              <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-emerald-700">
                Chọn một bài tập để bắt đầu
              </Link>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
