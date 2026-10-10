import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { createLesson } from "@/app/admin/course/actions";
import { LessonForm } from "@/components/admin/lesson-form";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAdmin } from "@/lib/auth";
import type { CourseWeek } from "@/lib/types";

export const metadata = { title: "Tạo bài giảng" };
export const instant = false;

type NewLessonPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function NewLessonPage({ params, searchParams }: NewLessonPageProps) {
  const [{ id }, feedback, { supabase, user }] = await Promise.all([params, searchParams, requireAdmin()]);
  const { data } = await supabase.from("course_weeks").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const week = data as CourseWeek;

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <Link href={`/admin/course/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={16} /> Tuần {week.week_number}</Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">Tạo bài giảng mới</h1>
        <p className="mt-3 text-slate-600">Bài mới được lưu ở trạng thái nháp trước khi xuất bản.</p>
        <div className="mt-8"><FeedbackBanner error={feedback.error} /></div>
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <LessonForm action={createLesson.bind(null, id)} submitLabel="Tạo bản nháp" />
        </div>
      </section>
    </AppShell>
  );
}
