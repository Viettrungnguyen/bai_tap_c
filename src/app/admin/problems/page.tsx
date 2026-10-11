import Link from "next/link";
import { ArrowRight, BookOpen, CirclePlus, Code2, Eye, FilePenLine, GraduationCap } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAdmin } from "@/lib/auth";
import type { Course, Problem, ProblemStatus } from "@/lib/types";

export const metadata = { title: "Ngân hàng đề" };
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
  const [{ supabase, user }, feedback] = await Promise.all([requireAdmin(), searchParams]);
  const [problemsResult, coursesResult] = await Promise.all([
    supabase.from("problems").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*").order("title"),
  ]);
  const problems = (problemsResult.data ?? []) as Problem[];
  const courses = (coursesResult.data ?? []) as Course[];
  const published = problems.filter((problem) => problem.status === "published").length;

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">NỘI DUNG THEO KHÓA HỌC</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Ngân hàng đề</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">Mỗi khóa học có ngân hàng đề coding riêng để tránh chọn nhầm đề khi giao bài.</p>
          </div>
          <Link href="/admin/problems/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700"><CirclePlus size={18} /> Tạo đề mới</Link>
        </div>

        <div className="mt-7"><FeedbackBanner error={feedback.error} message={feedback.message} /></div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Khóa có ngân hàng", courses.filter((course) => problems.some((problem) => problem.course_id === course.id)).length],
            ["Tổng số đề", problems.length],
            ["Đã xuất bản", published],
          ].map(([label, count]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-3xl font-semibold">{count}</div><div className="mt-1 text-sm text-slate-500">{label}</div></article>
          ))}
        </div>

        <div className="mt-8 space-y-7">
          {courses.map((course) => {
            const courseProblems = problems.filter((problem) => problem.course_id === course.id);
            return (
              <section key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-col gap-4 bg-slate-950 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950"><GraduationCap size={21} /></span>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{course.subject || "Khóa học"}</p><h2 className="mt-1 text-xl font-semibold">{course.title}</h2></div>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-sm text-slate-300">{courseProblems.length} đề</span><Link href={`/admin/problems/new?course=${course.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15"><CirclePlus size={14} /> Thêm đề</Link></div>
                </header>

                {courseProblems.length ? (
                  <div className="divide-y divide-slate-100">
                    {courseProblems.map((problem) => (
                      <article key={problem.id} className="flex flex-col gap-5 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <div className="flex min-w-0 items-start gap-4">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Code2 size={18} /></span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-semibold">{problem.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[problem.status]}`}>{statusLabel[problem.status]}</span></div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500"><span>{problem.difficulty === "easy" ? "Dễ" : problem.difficulty === "medium" ? "Trung bình" : "Khó"}</span><span>{problem.time_limit_ms} ms</span><span>{Math.round(problem.memory_limit_kb / 1024)} MB</span></div>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {problem.status === "published" ? <Link href={`/problems/${problem.slug}`} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700" title="Xem như học viên"><Eye size={18} /></Link> : null}
                          <Link href={`/admin/problems/${problem.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-emerald-700"><FilePenLine size={17} /> Chỉnh sửa</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center"><BookOpen className="mx-auto text-slate-400" size={25} /><p className="mt-3 text-sm text-slate-500">Khóa này chưa có đề coding.</p><Link href={`/admin/problems/new?course=${course.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">Tạo đề đầu tiên <ArrowRight size={15} /></Link></div>
                )}
              </section>
            );
          })}

          {!courses.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center"><GraduationCap className="mx-auto text-slate-400" size={30} /><h2 className="mt-4 text-xl font-semibold">Chưa có khóa học</h2><p className="mt-2 text-slate-500">Hãy tạo khóa học trước khi xây dựng ngân hàng đề.</p><Link href="/admin/courses" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Quản lý khóa học <ArrowRight size={15} /></Link></div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
