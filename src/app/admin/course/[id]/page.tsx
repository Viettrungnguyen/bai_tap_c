import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, CirclePlus, Eye, Send } from "lucide-react";
import { notFound } from "next/navigation";

import { setWeekStatus, updateWeek } from "@/app/admin/course/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { CourseWeek, Lesson } from "@/lib/types";

export const metadata = { title: "Quản lý tuần học" };
export const instant = false;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

type WeekPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminWeekPage({ params, searchParams }: WeekPageProps) {
  const [{ id }, feedback, { supabase, user }] = await Promise.all([params, searchParams, requireAdmin()]);
  const [weekResult, lessonsResult] = await Promise.all([
    supabase.from("course_weeks").select("*").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("*").eq("week_id", id).order("sort_order").order("created_at"),
  ]);
  if (!weekResult.data) notFound();

  const week = weekResult.data as CourseWeek;
  const lessons = (lessonsResult.data ?? []) as Lesson[];
  const updateAction = updateWeek.bind(null, id);
  const publishAction = setWeekStatus.bind(null, id, "published");
  const draftAction = setWeekStatus.bind(null, id, "draft");

  return (
    <AppShell email={user.email} isAdmin>
      <section className="space-y-8">
        <div>
          <Link href="/admin/course" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
            <ArrowLeft size={16} /> Danh sách tuần học
          </Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">TUẦN {week.week_number}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{week.title}</h1>
              <p className="mt-3 text-slate-600">{lessons.length} bài giảng · {week.status === "published" ? "đang hiển thị" : "bản nháp"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {week.status === "published" ? (
                <>
                  <Link href="/lessons" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
                    <Eye size={16} /> Xem như học viên
                  </Link>
                  <form action={draftAction}><SubmitButton className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Chuyển về nháp</SubmitButton></form>
                </>
              ) : (
                <form action={publishAction}><SubmitButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"><Send size={16} /> Xuất bản tuần</SubmitButton></form>
              )}
            </div>
          </div>
        </div>

        <FeedbackBanner error={feedback.error} message={feedback.message} />

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Thông tin tuần học</h2>
          <form action={updateAction} className="mt-6 space-y-5">
            <input type="hidden" name="courseId" value={week.course_id} />
            <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
              <label className="block text-sm font-semibold text-slate-700">Số tuần<input name="weekNumber" type="number" min={1} max={999} required defaultValue={week.week_number} className={inputClass} /></label>
              <label className="block text-sm font-semibold text-slate-700">Tên tuần<input name="title" required minLength={3} maxLength={160} defaultValue={week.title} className={inputClass} /></label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Mô tả<textarea name="description" rows={5} maxLength={5000} defaultValue={week.description} className={`${inputClass} resize-y leading-7`} /></label>
            <SubmitButton className="h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white hover:bg-emerald-700">Lưu tuần học</SubmitButton>
          </form>
        </section>

        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-2xl font-semibold">Bài giảng trong tuần</h2><p className="mt-1 text-sm text-slate-500">Sắp xếp theo trường thứ tự của từng bài.</p></div>
            <Link href={`/admin/course/${id}/lessons/new`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white hover:bg-emerald-700"><CirclePlus size={17} /> Tạo bài giảng</Link>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
            {lessons.length ? (
              <div className="divide-y divide-slate-100">
                {lessons.map((lesson, index) => (
                  <Link key={lesson.id} href={`/admin/course/${id}/lessons/${lesson.id}`} className="group flex items-center justify-between gap-4 p-5 hover:bg-slate-50">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-semibold text-slate-600">{index + 1}</span>
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{lesson.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lesson.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{lesson.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span></div><p className="mt-1 truncate text-sm text-slate-500">Thứ tự {lesson.sort_order}</p></div>
                    </div>
                    <ArrowRight size={17} className="shrink-0 text-slate-400 transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-14 text-center"><BookOpenText className="mx-auto text-slate-400" size={28} /><h3 className="mt-4 text-lg font-semibold">Chưa có bài giảng</h3><p className="mt-1 text-sm text-slate-500">Tạo bài giảng đầu tiên cho tuần này.</p></div>
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
