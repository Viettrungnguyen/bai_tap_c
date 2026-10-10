import Link from "next/link";
import { ArrowLeft, Download, Eye, Send, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

import {
  deleteLessonResource,
  setLessonStatus,
  updateLesson,
} from "@/app/admin/course/actions";
import { LessonForm } from "@/components/admin/lesson-form";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { LessonResourceUploadForm } from "@/components/lesson-resource-upload-form";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { CourseWeek, Lesson, LessonResource } from "@/lib/types";

export const metadata = { title: "Chỉnh sửa bài giảng" };
export const instant = false;

type EditLessonPageProps = {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function EditLessonPage({ params, searchParams }: EditLessonPageProps) {
  const [{ id, lessonId }, feedback, { supabase, user }] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);
  const [weekResult, lessonResult, resourcesResult] = await Promise.all([
    supabase.from("course_weeks").select("*").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("*").eq("id", lessonId).eq("week_id", id).maybeSingle(),
    supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId).order("sort_order").order("created_at"),
  ]);
  if (!weekResult.data || !lessonResult.data) notFound();

  const week = weekResult.data as CourseWeek;
  const lesson = lessonResult.data as Lesson;
  const resources = (resourcesResult.data ?? []) as LessonResource[];
  const resourcesWithUrls = await Promise.all(
    resources.map(async (resource) => {
      const { data } = await supabase.storage.from("lesson-resources").createSignedUrl(resource.storage_path, 3600);
      return { ...resource, downloadUrl: data?.signedUrl ?? null };
    }),
  );
  const updateAction = updateLesson.bind(null, id, lessonId);
  const publishAction = setLessonStatus.bind(null, id, lessonId, "published");
  const draftAction = setLessonStatus.bind(null, id, lessonId, "draft");

  return (
    <AppShell email={user.email} isAdmin>
      <section className="space-y-8">
        <div>
          <Link href={`/admin/course/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={16} /> Tuần {week.week_number}</Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-4xl font-semibold tracking-[-0.04em]">{lesson.title}</h1><span className={`rounded-full px-3 py-1 text-xs font-bold ${lesson.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{lesson.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span></div><p className="mt-3 text-slate-600">{resources.length} tài liệu đính kèm</p></div>
            <div className="flex flex-wrap gap-2">
              {lesson.status === "published" ? (
                <><Link href={`/lessons/${lesson.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"><Eye size={16} /> Xem bài</Link><form action={draftAction}><SubmitButton className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Chuyển về nháp</SubmitButton></form></>
              ) : (
                <form action={publishAction}><SubmitButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"><Send size={16} /> Xuất bản bài</SubmitButton></form>
              )}
            </div>
          </div>
        </div>

        <FeedbackBanner error={feedback.error} message={feedback.message} />

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-semibold">Nội dung bài giảng</h2>
          <LessonForm action={updateAction} lesson={lesson} submitLabel="Lưu thay đổi" />
        </section>

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">TÀI LIỆU</p><h2 className="mt-2 text-2xl font-semibold">File đính kèm</h2><p className="mt-2 text-sm leading-6 text-slate-500">PDF, Word, PowerPoint, Markdown, text, ZIP hoặc ảnh; tối đa 10 MB mỗi file.</p></div>

          <div className="mt-6 space-y-3">
            {resourcesWithUrls.map((resource) => (
              <div key={resource.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><h3 className="truncate font-semibold">{resource.title}</h3><p className="mt-1 truncate text-xs text-slate-500">{resource.file_name} · {formatFileSize(resource.file_size)} · thứ tự {resource.sort_order}</p></div>
                <div className="flex shrink-0 items-center gap-3">
                  {resource.downloadUrl ? <a href={resource.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><Download size={15} /> Tải xuống</a> : null}
                  <form action={deleteLessonResource.bind(null, id, lessonId, resource.id)}><ConfirmSubmitButton message={`Xóa tài liệu “${resource.title}”?`} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700"><Trash2 size={15} /> Xóa</ConfirmSubmitButton></form>
                </div>
              </div>
            ))}
          </div>

          <LessonResourceUploadForm lessonId={lessonId} userId={user.id} defaultSortOrder={resources.length} />
        </section>
      </section>
    </AppShell>
  );
}
