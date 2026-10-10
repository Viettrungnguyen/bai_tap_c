import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Download, FileCode2, FileText, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DownloadSourceButton } from "@/components/download-source-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { SubmissionFile, SubmissionStatus, SubmissionWithAssignment } from "@/lib/types";

export const metadata = { title: "Chi tiết bài nộp" };
export const instant = false;

const statusConfig: Record<
  SubmissionStatus,
  { label: string; icon: typeof Clock3; style: string }
> = {
  pending: { label: "Chờ admin review", icon: Clock3, style: "bg-amber-50 text-amber-700" },
  correct: { label: "Đúng", icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" },
  incorrect: { label: "Chưa đúng", icon: XCircle, style: "bg-rose-50 text-rose-700" },
};

type SubmissionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function SubmissionPage({ params, searchParams }: SubmissionPageProps) {
  const [{ id }, feedback, { supabase, user, profile }] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);
  const { data } = await supabase
    .from("submissions")
    .select("*, assignments(id, title, slug, assignment_type), problems(title, slug)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const submission = data as SubmissionWithAssignment;
  const { data: fileRows } = await supabase
    .from("submission_files")
    .select("*")
    .eq("submission_id", id)
    .order("uploaded_at");
  const files = (fileRows ?? []) as SubmissionFile[];
  const filesWithUrls = await Promise.all(files.map(async (file) => {
    const { data: signed } = await supabase.storage.from("assignment-submissions").createSignedUrl(file.storage_path, 600);
    return { ...file, url: signed?.signedUrl ?? null };
  }));
  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <section>
        <FeedbackBanner error={feedback.error} message={feedback.message} />
        <Link
          href="/submissions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} /> Lịch sử bài nộp
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">CHI TIẾT BÀI NỘP</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              {submission.assignments?.title ?? submission.problems?.title ?? "Bài giao"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">Nộp lúc {formatDateTime(submission.submitted_at)}</p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${config.style}`}>
            <StatusIcon size={16} /> {config.label}
          </span>
        </div>

        {filesWithUrls.length ? <div className="mt-7 overflow-hidden rounded-2xl border border-slate-900/10 bg-white"><div className="border-b border-slate-100 px-5 py-4 font-semibold">File đã nộp</div><div className="divide-y divide-slate-100">{filesWithUrls.map((file) => <div key={file.id} className="flex items-center justify-between gap-4 p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><FileText size={18} /></span><div className="min-w-0"><div className="truncate font-semibold">{file.file_name}</div><div className="text-xs text-slate-500">{Math.ceil(file.file_size / 1024)} KB</div></div></div>{file.url ? <a href={file.url} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"><Download size={15} /> Tải file</a> : null}</div>)}</div></div> : null}

        {submission.source_code && submission.file_name ? <div className="mt-7 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
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
          <pre className="max-h-[680px] overflow-auto bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-200 sm:p-7">
            <code>{submission.source_code}</code>
          </pre>
        </div> : null}

        {submission.status !== "pending" ? (
          <section className="mt-6 rounded-2xl border border-slate-900/10 bg-white p-6">
            <h2 className="text-lg font-semibold">Kết quả review</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm</div>
                <div className="mt-1 text-2xl font-semibold">{submission.score ?? 0}/100</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Thời gian review</div>
                <div className="mt-2 text-sm text-slate-700">
                  {submission.reviewed_at ? formatDateTime(submission.reviewed_at) : "—"}
                </div>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Nhận xét</div>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                {submission.review_note || "Admin không để lại nhận xét."}
              </p>
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
