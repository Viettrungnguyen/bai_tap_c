import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileCode2, MinusCircle, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getProblemProgress, type ProblemProgressStatus, type ProgressSubmission } from "@/lib/progress";
import type { Assignment, Course, CourseClass, CourseMember, Profile } from "@/lib/types";

export const metadata = { title: "Chi tiết tiến độ" };
export const instant = false;

const statusConfig: Record<ProblemProgressStatus, { label: string; icon: typeof Clock3; style: string }> = {
  not_started: { label: "Chưa làm", icon: MinusCircle, style: "bg-slate-100 text-slate-600" },
  pending: { label: "Chờ chấm", icon: Clock3, style: "bg-amber-50 text-amber-700" },
  correct: { label: "Đúng", icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" },
  incorrect: { label: "Chưa đúng", icon: XCircle, style: "bg-rose-50 text-rose-700" },
};

export default async function AdminUserProgressPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id: rawId } = await params;
  const parsedId = z.uuid().safeParse(rawId);
  if (!parsedId.success) notFound();

  const { supabase, user } = await requireAdmin();
  const [profileResult, assignmentsResult, submissionsResult, coursesResult, classesResult, membersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, username, student_code, school, major, must_change_password, role, created_at, updated_at")
      .eq("id", parsedId.data)
      .eq("role", "user")
      .maybeSingle(),
    supabase.from("assignments").select("*").eq("status", "published").order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select("id, user_id, assignment_id, problem_id, status, score, submitted_at")
      .eq("user_id", parsedId.data)
      .order("submitted_at", { ascending: false }),
    supabase.from("courses").select("*").order("title"),
    supabase.from("course_classes").select("*").order("name"),
    supabase.from("course_members").select("*").eq("user_id", parsedId.data),
  ]);

  if (!profileResult.data) notFound();

  const learner = profileResult.data as Profile;
  const courses = (coursesResult.data ?? []) as Course[];
  const classes = (classesResult.data ?? []) as CourseClass[];
  const members = (membersResult.data ?? []) as CourseMember[];
  const learnerClassIds = new Set(members.map((item) => item.class_id));
  const learnerCourseIds = new Set(classes.filter((item) => learnerClassIds.has(item.id)).map((item) => item.course_id));
  const problems = ((assignmentsResult.data ?? []) as Assignment[]).filter((item) => item.class_id ? learnerClassIds.has(item.class_id) : learnerCourseIds.has(item.course_id));
  const submissions = (submissionsResult.data ?? []) as ProgressSubmission[];
  const rows = problems.map((problem) => ({
    problem,
    progress: getProblemProgress(
      submissions.filter((submission) => submission.assignment_id === problem.id),
    ),
  }));
  const attempted = rows.filter((row) => row.progress.status !== "not_started").length;
  const correct = rows.filter((row) => row.progress.status === "correct").length;
  const percent = problems.length ? Math.round((correct / problems.length) * 100) : 0;

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft size={16} /> Quay lại bảng tổng kết
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">CHI TIẾT HỌC VIÊN</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              {learner.full_name || learner.email}
            </h1>
            <p className="mt-3 text-slate-600">
              {learner.username ? `@${learner.username}` : learner.email}
              {learner.school ? ` · ${learner.school}` : ""}
              {learner.major ? ` · ${learner.major}` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Hoàn thành</div>
            <div className="mt-1 text-3xl font-semibold text-emerald-900">{percent}%</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Tổng số bài", problems.length],
            ["Đã làm", attempted],
            ["Đã làm đúng", correct],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <div className="text-3xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </article>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
          {rows.length ? (
            <div className="divide-y divide-slate-100">
              {rows.map(({ problem, progress }, index) => {
                const config = statusConfig[progress.status];
                const Icon = config.icon;
                return (
                  <article key={problem.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 font-semibold text-slate-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{problem.title}</h2>
                        <p className="mt-1 text-xs font-semibold text-emerald-700">{courses.find((item) => item.id === problem.course_id)?.title || "Khóa học"} · {classes.find((item) => item.id === problem.class_id)?.name || "Toàn khóa"}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{progress.attempts} lần nộp</span>
                          {progress.lastSubmittedAt ? <span>Lần cuối {formatDateTime(progress.lastSubmittedAt)}</span> : null}
                          {progress.submission?.score !== null && progress.submission ? <span>{progress.submission.score}/100 điểm</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${config.style}`}>
                        <Icon size={14} /> {config.label}
                      </span>
                      {progress.submission ? (
                        <Link
                          href={`/admin/submissions/${progress.submission.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                        >
                          <FileCode2 size={16} /> Xem bài nộp
                        </Link>
                      ) : (
                        <Link href={`/assignments/${problem.id}`} className="text-sm font-semibold text-slate-500 hover:text-emerald-700">
                          Xem bài giao
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <h2 className="text-xl font-semibold">Chưa có bài giao được xuất bản</h2>
              <p className="mt-2 text-slate-500">Tiến độ sẽ xuất hiện sau khi admin xuất bản bài giao.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
