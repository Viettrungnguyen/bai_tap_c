import Link from "next/link";
import { ArrowRight, CirclePlus, Layers3 } from "lucide-react";

import { createCourse } from "@/app/admin/courses/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { Course, CourseClass } from "@/lib/types";

export const metadata = { title: "Khóa học & lớp học" };
export const instant = false;
const field = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ supabase, user }, feedback] = await Promise.all([requireAdmin(), searchParams]);
  const [coursesResult, classesResult] = await Promise.all([supabase.from("courses").select("*").order("created_at"), supabase.from("course_classes").select("*")]);
  const courses = (coursesResult.data ?? []) as Course[];
  const classes = (classesResult.data ?? []) as CourseClass[];
  return <AppShell email={user.email} isAdmin><section><p className="text-sm font-semibold text-emerald-700">TỔ CHỨC ĐÀO TẠO</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Khóa học & lớp học</h1><p className="mt-3 text-slate-600">Tách nội dung môn học khỏi từng nhóm học viên và theo dõi tiến độ đúng lớp.</p><div className="mt-7"><FeedbackBanner {...feedback} /></div><div className="grid gap-6 xl:grid-cols-[1fr_380px]"><div className="space-y-4">{courses.map((course) => { const count = classes.filter((item) => item.course_id === course.id).length; return <Link key={course.id} href={`/admin/courses/${course.id}`} className="group block rounded-2xl border border-slate-900/10 bg-white p-6 hover:border-emerald-400"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><h2 className="text-xl font-semibold">{course.title}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{course.status}</span></div><p className="mt-2 text-sm text-emerald-700">{course.subject || "Chưa đặt môn học"} · {count} lớp</p><p className="mt-3 line-clamp-2 text-slate-500">{course.description || "Chưa có mô tả."}</p></div><ArrowRight className="text-slate-400 group-hover:text-emerald-700" /></div></Link>; })}{!courses.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500"><Layers3 className="mx-auto mb-3" />Chưa có khóa học.</div> : null}</div><aside className="h-fit rounded-2xl border border-slate-900/10 bg-white p-6"><h2 className="text-xl font-semibold">Tạo khóa học</h2><form action={createCourse} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Tên khóa<input name="title" required minLength={3} className={field} /></label><label className="block text-sm font-semibold">Slug<input name="slug" required placeholder="lap-trinh-java" className={field} /></label><label className="block text-sm font-semibold">Môn học<input name="subject" placeholder="Java, SQL, C/C++..." className={field} /></label><label className="block text-sm font-semibold">Mô tả<textarea name="description" rows={4} className={field} /></label><SubmitButton className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-semibold text-white"><CirclePlus size={17} /> Tạo khóa học</SubmitButton></form></aside></div></section></AppShell>;
}
