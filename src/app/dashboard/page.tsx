import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleDashed, Clock3, Layers3 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Assignment, Course, CourseClass } from "@/lib/types";

export const metadata = { title: "Bài giao" };
export const instant = false;

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser();
  const [coursesResult, classesResult, assignmentsResult, submissionsResult] = await Promise.all([
    supabase.from("courses").select("*").order("created_at"),
    supabase.from("course_classes").select("*").eq("status", "active").order("name"),
    supabase.from("assignments").select("*").eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("submissions").select("assignment_id, status").eq("user_id", user.id),
  ]);
  const courses = (coursesResult.data ?? []) as Course[]; const classes = (classesResult.data ?? []) as CourseClass[]; const assignments = (assignmentsResult.data ?? []) as Assignment[];
  const rows = (submissionsResult.data ?? []) as Array<{ assignment_id: string; status: "pending" | "correct" | "incorrect" }>;
  const completed = new Set(rows.filter((item) => item.status === "correct").map((item) => item.assignment_id)); const attempted = new Set(rows.map((item) => item.assignment_id));
  const displayName = profile?.full_name || profile?.username || user.email?.split("@")[0] || "bạn";
  const stats = [{ icon: BookOpen, label: "Tổng bài được giao", value: assignments.length, color: "bg-blue-50 text-blue-700" }, { icon: CheckCircle2, label: "Đã hoàn thành", value: completed.size, color: "bg-emerald-50 text-emerald-700" }, { icon: CircleDashed, label: "Đang thực hiện", value: [...attempted].filter((id) => !completed.has(id)).length, color: "bg-amber-50 text-amber-700" }];
  return <AppShell email={user.email} isAdmin={profile?.role === "admin"}><section><p className="text-sm font-semibold text-emerald-700">TỔNG QUAN HỌC TẬP</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Chào {displayName}</h1><p className="mt-3 text-slate-600">Bài giảng và bài giao được sắp xếp theo đúng khóa học, lớp học của bạn.</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{stats.map(({ icon: Icon, label, value, color }) => <article key={label} className="rounded-2xl border border-slate-900/10 bg-white p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon size={20} /></span><div className="mt-5 text-3xl font-semibold">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></article>)}</div>
    <div className="mt-10 space-y-8">{courses.map((course) => { const courseAssignments = assignments.filter((item) => item.course_id === course.id); if (!courseAssignments.length) return null; const courseClasses = classes.filter((item) => item.course_id === course.id); return <section key={course.id}><div className="flex items-end justify-between"><div><p className="text-sm font-semibold text-emerald-700">{course.subject || "KHÓA HỌC"}</p><h2 className="mt-1 text-2xl font-semibold">{course.title}</h2><p className="mt-1 text-sm text-slate-500">{courseClasses.map((item) => item.name).join(" · ") || "Bài giao toàn khóa"}</p></div><span className="text-sm text-slate-500">{courseAssignments.length} bài</span></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{courseAssignments.map((assignment) => <Link key={assignment.id} href={`/assignments/${assignment.id}`} className="group rounded-2xl border border-slate-900/10 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-slate-900/5"><div className="flex items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{assignment.assignment_type === "coding" ? "Coding" : assignment.assignment_type === "file" ? "Nộp file" : "Bài viết"}</span>{completed.has(assignment.id) ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Đã đúng</span> : attempted.has(assignment.id) ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Đã nộp</span> : null}</div><ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" /></div><h3 className="mt-5 text-xl font-semibold">{assignment.title}</h3><p className="mt-2 line-clamp-2 min-h-12 leading-6 text-slate-500">{assignment.description || "Mở bài giao để xem yêu cầu chi tiết."}</p><div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><Layers3 size={14} /> {classes.find((item) => item.id === assignment.class_id)?.name || "Toàn khóa"}</span>{assignment.due_at ? <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {formatDateTime(assignment.due_at)}</span> : null}</div></Link>)}</div></section>; })}</div>
    {!assignments.length ? <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"><BookOpen className="mx-auto text-slate-400" /><h2 className="mt-4 text-xl font-semibold">Chưa có bài được giao</h2><p className="mt-2 text-slate-500">Bài mới sẽ xuất hiện khi giảng viên xuất bản cho khóa hoặc lớp của bạn.</p></div> : null}
  </section></AppShell>;
}
