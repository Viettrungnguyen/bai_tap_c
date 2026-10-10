import Link from "next/link";
import { BookOpen, CirclePlus, Eye, FilePenLine } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAdmin } from "@/lib/auth";
import type { Problem, ProblemStatus } from "@/lib/types";

export const metadata = { title: "Quản lý bài tập" };
export const instant = false;

const statusStyle: Record<ProblemStatus, string> = {
  draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  archived: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusLabel: Record<ProblemStatus, string> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};

type ProblemsPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const [{ supabase, user }, feedback] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const { data } = await supabase
    .from("problems")
    .select("*")
    .order("created_at", { ascending: false });
  const problems = (data ?? []) as Problem[];

  const counts = {
    total: problems.length,
    published: problems.filter((problem) => problem.status === "published").length,
    draft: problems.filter((problem) => problem.status === "draft").length,
  };

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">NỘI DUNG HỌC TẬP</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Quản lý bài tập</h1>
            <p className="mt-3 text-slate-600">Tạo đề, cấu hình test và kiểm soát trạng thái xuất bản.</p>
          </div>
          <Link
            href="/admin/problems/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700"
          >
            <CirclePlus size={18} /> Tạo bài mới
          </Link>
        </div>

        <div className="mt-8">
          <FeedbackBanner error={feedback.error} message={feedback.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Tổng số bài", counts.total],
            ["Đã xuất bản", counts.published],
            ["Bản nháp", counts.draft],
          ].map(([label, count]) => (
            <div key={label} className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <div className="text-3xl font-semibold">{count}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
          {problems.length ? (
            <div className="divide-y divide-slate-100">
              {problems.map((problem) => (
                <article
                  key={problem.id}
                  className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold">{problem.title}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[problem.status]}`}
                      >
                        {statusLabel[problem.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>/{problem.slug}</span>
                      <span>{problem.time_limit_ms} ms</span>
                      <span>{Math.round(problem.memory_limit_kb / 1024)} MB</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {problem.status === "published" ? (
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                        title="Xem như học viên"
                      >
                        <Eye size={18} />
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/problems/${problem.id}/edit`}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <FilePenLine size={17} /> Chỉnh sửa
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <BookOpen size={23} />
              </span>
              <h2 className="mt-5 text-xl font-semibold">Chưa có bài tập</h2>
              <p className="mt-2 text-slate-500">Tạo bài đầu tiên để bắt đầu xây dựng nội dung lớp học.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
