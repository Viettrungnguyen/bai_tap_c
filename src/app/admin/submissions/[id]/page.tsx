import Link from "next/link";
import { ArrowLeft, FileCode2, Save } from "lucide-react";
import { notFound } from "next/navigation";

import { reviewSubmission } from "@/app/submissions/actions";
import { AppShell } from "@/components/app-shell";
import { DownloadSourceButton } from "@/components/download-source-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Problem, Submission } from "@/lib/types";

export const metadata = { title: "Review bài nộp" };
export const instant = false;

type AdminSubmission = Submission & {
  problems: Pick<Problem, "title" | "slug"> | null;
  submitter: { full_name: string | null; email: string; student_code: string | null } | null;
};

type AdminSubmissionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminSubmissionPage({
  params,
  searchParams,
}: AdminSubmissionPageProps) {
  const [{ id }, feedback, { supabase, user }] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);
  const { data } = await supabase
    .from("submissions")
    .select(
      "*, problems(title, slug), submitter:profiles!submissions_user_id_fkey(full_name, email, student_code)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const submission = data as AdminSubmission;
  const reviewAction = reviewSubmission.bind(null, id);

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <FeedbackBanner error={feedback.error} message={feedback.message} />
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} /> Danh sách bài nộp
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-emerald-700">REVIEW SOURCE CODE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            {submission.problems?.title ?? "Bài tập"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            <span>{submission.submitter?.full_name || submission.submitter?.email || "User"}</span>
            {submission.submitter?.student_code ? <span>{submission.submitter.student_code}</span> : null}
            <span>{formatDateTime(submission.submitted_at)}</span>
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <FileCode2 size={19} />
                </span>
                <div>
                  <div className="font-semibold">{submission.file_name}</div>
                  <div className="text-xs text-slate-500">{submission.language === "c11" ? "C11" : "C++17"}</div>
                </div>
              </div>
              <DownloadSourceButton sourceCode={submission.source_code} fileName={submission.file_name} />
            </div>
            <pre className="max-h-[760px] overflow-auto bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-200 sm:p-7">
              <code>{submission.source_code}</code>
            </pre>
          </div>

          <aside>
            <form action={reviewAction} className="sticky top-8 rounded-2xl border border-slate-900/10 bg-white p-6">
              <h2 className="text-xl font-semibold">Kết quả review</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Đánh giá thủ công file code đã nộp. Hệ thống không chạy chương trình.
              </p>

              <label className="mt-6 block text-sm font-semibold text-slate-700">
                Trạng thái
                <select
                  name="status"
                  defaultValue={submission.status === "pending" ? "correct" : submission.status}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="correct">Đúng</option>
                  <option value="incorrect">Chưa đúng</option>
                </select>
              </label>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Điểm
                <input
                  name="score"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={submission.score ?? 100}
                  required
                  className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Nhận xét
                <textarea
                  name="reviewNote"
                  rows={8}
                  maxLength={5000}
                  defaultValue={submission.review_note ?? ""}
                  placeholder="Nhận xét về cách giải, lỗi cần sửa..."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <SubmitButton className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-semibold text-white transition hover:bg-emerald-700">
                <Save size={17} /> Lưu kết quả
              </SubmitButton>
            </form>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
