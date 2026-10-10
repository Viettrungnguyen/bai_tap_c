import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileCode2, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Problem, Submission, SubmissionStatus } from "@/lib/types";

export const metadata = { title: "Review bài nộp" };
export const instant = false;

type AdminSubmission = Submission & {
  problems: Pick<Problem, "title"> | null;
  submitter: { full_name: string | null; email: string } | null;
};

const statusConfig: Record<
  SubmissionStatus,
  { label: string; icon: typeof Clock3; style: string }
> = {
  pending: { label: "Chờ review", icon: Clock3, style: "bg-amber-50 text-amber-700" },
  correct: { label: "Đúng", icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" },
  incorrect: { label: "Chưa đúng", icon: XCircle, style: "bg-rose-50 text-rose-700" },
};

export default async function AdminSubmissionsPage() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase
    .from("submissions")
    .select("*, problems(title), submitter:profiles!submissions_user_id_fkey(full_name, email)")
    .order("submitted_at", { ascending: false });
  const submissions = (data ?? []) as AdminSubmission[];
  const pendingCount = submissions.filter((item) => item.status === "pending").length;

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <p className="text-sm font-semibold text-emerald-700">QUẢN TRỊ</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Review bài nộp</h1>
        <p className="mt-3 text-slate-600">
          {pendingCount} bài đang chờ xem · {submissions.length} bài nộp tất cả
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
                    href={`/admin/submissions/${submission.id}`}
                    className="group flex flex-col gap-4 p-5 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <FileCode2 size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{submission.problems?.title ?? "Bài tập đã xóa"}</h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {submission.submitter?.full_name || submission.submitter?.email || "User"} · {submission.file_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(submission.submitted_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
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
              <h2 className="mt-5 text-xl font-semibold">Chưa có bài nộp</h2>
              <p className="mt-2 text-slate-500">Bài nộp của học viên sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
