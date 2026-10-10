import Link from "next/link";
import { ArrowLeft, CalendarClock, TerminalSquare } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AssignmentUploadForm } from "@/components/assignment-upload-form";
import { FeedbackBanner } from "@/components/feedback-banner";
import { MarkdownContent } from "@/components/markdown-content";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Assignment, Course, CourseClass, Problem, Submission } from "@/lib/types";

export const metadata = { title: "Chi tiết bài giao" };
export const instant = false;

export default async function AssignmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ id }, feedback, { supabase, user, profile }] = await Promise.all([params, searchParams, requireUser()]);
  const assignmentResult = await supabase.from("assignments").select("*").eq("id", id).maybeSingle();
  if (!assignmentResult.data) notFound();
  const assignment = assignmentResult.data as Assignment;
  const [courseResult, classResult, problemResult, submissionsResult] = await Promise.all([
    supabase.from("courses").select("*").eq("id", assignment.course_id).maybeSingle(),
    assignment.class_id ? supabase.from("course_classes").select("*").eq("id", assignment.class_id).maybeSingle() : Promise.resolve({ data: null }),
    assignment.problem_id ? supabase.from("problems").select("*").eq("id", assignment.problem_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("submissions").select("*").eq("assignment_id", id).eq("user_id", user.id).order("submitted_at", { ascending: false }),
  ]);
  const course = courseResult.data as Course | null; const classroom = classResult.data as CourseClass | null; const problem = problemResult.data as Problem | null; const submissions = (submissionsResult.data ?? []) as Submission[];
          return <AppShell email={user.email} isAdmin={profile?.role === "admin"}><section><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16} /> Danh sách bài giao</Link><div className="mt-6 grid gap-8 xl:grid-cols-[1fr_360px]"><article className="rounded-3xl border border-slate-900/10 bg-white p-6 sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{assignment.assignment_type}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{course?.title}</span>{classroom ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{classroom.name}</span> : null}</div><h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">{assignment.title}</h1>{assignment.due_at ? <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"><CalendarClock size={17} /> Hạn nộp {formatDateTime(assignment.due_at)}</p> : null}<p className="mt-6 whitespace-pre-wrap leading-7 text-slate-600">{assignment.description}</p>{assignment.instructions ? <div className="mt-8 border-t border-slate-100 pt-8"><h2 className="text-2xl font-semibold">Yêu cầu</h2><div className="mt-4"><MarkdownContent content={assignment.instructions} /></div></div> : null}{problem ? <Link href={`/problems/${problem.slug}?assignment=${assignment.id}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"><TerminalSquare size={18} /> Xem đề lập trình chi tiết</Link> : null}</article><aside className="space-y-5"><div><FeedbackBanner {...feedback} /></div><article className="rounded-2xl border border-slate-900/10 bg-white p-6"><h2 className="text-xl font-semibold">Nộp bài</h2><p className="mt-2 text-sm leading-6 text-slate-500">Tối đa {assignment.max_files} file, {Math.round(assignment.max_file_size / 1024 / 1024)} MB mỗi file.{assignment.allowed_extensions.length ? ` Định dạng: ${assignment.allowed_extensions.join(", ")}.` : " Chấp nhận mọi định dạng."}</p><AssignmentUploadForm assignmentId={assignment.id} problemId={assignment.problem_id} userId={user.id} allowedExtensions={assignment.allowed_extensions} maxFiles={assignment.max_files} maxFileSize={assignment.max_file_size} /></article><article className="rounded-2xl border border-slate-900/10 bg-white p-6"><h2 className="font-semibold">Lịch sử của bạn</h2><div className="mt-4 space-y-2">{submissions.map((item) => <Link key={item.id} href={`/submissions/${item.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{formatDateTime(item.submitted_at)}</span><span className="font-semibold">{item.status === "pending" ? "Chờ chấm" : item.status === "correct" ? "Đúng" : "Chưa đúng"}</span></Link>)}{!submissions.length ? <p className="text-sm text-slate-500">Bạn chưa nộp bài này.</p> : null}</div></article></aside></div></section></AppShell>;
}
