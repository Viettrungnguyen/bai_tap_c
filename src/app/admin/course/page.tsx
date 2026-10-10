import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarDays, CirclePlus, Layers3 } from "lucide-react";

import { createWeek } from "@/app/admin/course/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { Course, CourseWeek, Lesson } from "@/lib/types";

export const metadata = { title: "Quản lý bài giảng" };
export const instant = false;

type CoursePageProps = { searchParams: Promise<{ course?: string; error?: string; message?: string }> };
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export default async function AdminCoursePage({ searchParams }: CoursePageProps) {
  const [{ supabase, user }, feedback] = await Promise.all([requireAdmin(), searchParams]);
  const coursesResult = await supabase.from("courses").select("*").order("created_at");
  const courses = (coursesResult.data ?? []) as Course[];
  const selectedCourse = courses.find((course) => course.id === feedback.course) ?? courses[0];
  const [weeksResult, lessonsResult] = selectedCourse
    ? await Promise.all([
        supabase.from("course_weeks").select("*").eq("course_id", selectedCourse.id).order("week_number"),
        supabase.from("lessons").select("id, week_id, status"),
      ])
    : [{ data: [] }, { data: [] }];
  const weeks = (weeksResult.data ?? []) as CourseWeek[];
  const lessons = (lessonsResult.data ?? []) as Pick<Lesson, "id" | "week_id" | "status">[];

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-emerald-700">NỘI DUNG KHÓA HỌC</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Bài giảng theo tuần</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Mỗi tuần thuộc một khóa học, phù hợp cho C, SQL, Java và các môn khác.</p></div>
          <Link href="/admin/courses" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold hover:border-emerald-500"><Layers3 size={17} /> Quản lý khóa & lớp</Link>
        </div>
        <div className="mt-8"><FeedbackBanner error={feedback.error} message={feedback.message} /></div>
        {courses.length ? <>
          <div className="mb-6 flex gap-2 overflow-x-auto">{courses.map((course) => <Link key={course.id} href={`/admin/course?course=${course.id}`} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${course.id === selectedCourse?.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{course.title}</Link>)}</div>
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">{weeks.length ? weeks.map((week) => {
              const weekLessons = lessons.filter((lesson) => lesson.week_id === week.id);
              const published = weekLessons.filter((lesson) => lesson.status === "published").length;
              return <Link key={week.id} href={`/admin/course/${week.id}`} className="group flex flex-col gap-5 rounded-2xl border border-slate-900/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-400 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 font-semibold text-emerald-300">{week.week_number}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold">{week.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${week.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{week.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{week.description || "Chưa có mô tả."}</p><p className="mt-2 text-xs font-semibold text-slate-400">{weekLessons.length} bài giảng · {published} đã xuất bản</p></div></div><ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" size={19} /></Link>;
            }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"><BookOpenText className="mx-auto text-slate-400" size={30} /><h2 className="mt-4 text-xl font-semibold">Chưa có tuần học</h2></div>}</div>
            <aside className="h-fit rounded-2xl border border-slate-900/10 bg-white p-6 xl:sticky xl:top-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays size={19} /></span><div><h2 className="font-semibold">Tạo tuần học</h2><p className="text-xs text-slate-500">Trong {selectedCourse?.title}</p></div></div><form action={createWeek} className="mt-6 space-y-4"><input type="hidden" name="courseId" value={selectedCourse?.id} /><label className="block text-sm font-semibold text-slate-700">Số tuần<input name="weekNumber" type="number" min={1} max={999} required className={inputClass} /></label><label className="block text-sm font-semibold text-slate-700">Tên tuần<input name="title" minLength={3} maxLength={160} required className={inputClass} /></label><label className="block text-sm font-semibold text-slate-700">Mô tả<textarea name="description" rows={5} maxLength={5000} className={`${inputClass} resize-y`} /></label><SubmitButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-semibold text-white hover:bg-emerald-700"><CirclePlus size={17} /> Tạo tuần</SubmitButton></form></aside>
          </div>
        </> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Layers3 className="mx-auto text-slate-400" /><h2 className="mt-4 text-xl font-semibold">Hãy tạo khóa học trước</h2><Link href="/admin/courses" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">Tạo khóa học</Link></div>}
      </section>
    </AppShell>
  );
}
