import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarDays, FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { Course, CourseWeek, Lesson } from "@/lib/types";

export const metadata = { title: "Bài giảng" };
export const instant = false;

export default async function LessonsPage() {
  const { supabase, user, profile } = await requireUser();
  const [coursesResult, weeksResult, lessonsResult, resourcesResult] = await Promise.all([
    supabase.from("courses").select("*").order("title"),
    supabase.from("course_weeks").select("*").eq("status", "published").order("week_number"),
    supabase.from("lessons").select("*").eq("status", "published").order("sort_order").order("created_at"),
    supabase.from("lesson_resources").select("id, lesson_id"),
  ]);
  const courses = (coursesResult.data ?? []) as Course[];
  const weeks = (weeksResult.data ?? []) as CourseWeek[];
  const lessons = (lessonsResult.data ?? []) as Lesson[];
  const resources = (resourcesResult.data ?? []) as Array<{ id: string; lesson_id: string }>;

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <section>
        <p className="text-sm font-semibold text-emerald-700">LỘ TRÌNH HỌC</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Bài giảng theo tuần</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Theo dõi từng tuần học, đọc nội dung bài giảng và tải tài liệu liên quan.
        </p>

        {weeks.length ? (
          <div className="mt-8 space-y-6">
            {weeks.map((week) => {
              const weekLessons = lessons.filter((lesson) => lesson.week_id === week.id);
              const course = courses.find((item) => item.id === week.course_id);
              return (
                <section key={week.id} className="overflow-hidden rounded-3xl border border-slate-900/10 bg-white">
                  <div className="bg-slate-950 p-6 text-white sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-emerald-300"><CalendarDays size={18} /> {course?.title || "Khóa học"} · Tuần {week.week_number}</div>
                    <h2 className="mt-3 text-2xl font-semibold">{week.title}</h2>
                    {week.description ? <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7 text-slate-300">{week.description}</p> : null}
                  </div>
                  {weekLessons.length ? (
                    <div className="divide-y divide-slate-100">
                      {weekLessons.map((lesson, index) => {
                        const resourceCount = resources.filter((resource) => resource.lesson_id === lesson.id).length;
                        return (
                          <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="group flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex min-w-0 items-start gap-4">
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 font-semibold text-emerald-700">{index + 1}</span>
                              <div className="min-w-0"><h3 className="text-lg font-semibold">{lesson.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{lesson.summary || "Mở bài giảng để xem nội dung chi tiết."}</p><p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><FileText size={13} /> {resourceCount} tài liệu</p></div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700">Học bài <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-10 text-center text-sm text-slate-500">Tuần này chưa có bài giảng được xuất bản.</div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"><BookOpenText className="mx-auto text-slate-400" size={30} /><h2 className="mt-4 text-xl font-semibold">Chưa có bài giảng được xuất bản</h2><p className="mt-2 text-slate-500">Nội dung học tập sẽ xuất hiện tại đây theo từng tuần.</p></div>
        )}
      </section>
    </AppShell>
  );
}
