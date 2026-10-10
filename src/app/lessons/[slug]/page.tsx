import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MarkdownContent } from "@/components/markdown-content";
import { requireUser } from "@/lib/auth";
import type { CourseWeek, Lesson, LessonResource } from "@/lib/types";

export const metadata = { title: "Nội dung bài giảng" };
export const instant = false;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const { supabase, user, profile } = await requireUser();
  const { data: lessonData } = await supabase
    .from("lessons")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!lessonData) notFound();
  const lesson = lessonData as Lesson;

  const [weekResult, resourcesResult] = await Promise.all([
    supabase.from("course_weeks").select("*").eq("id", lesson.week_id).eq("status", "published").maybeSingle(),
    supabase.from("lesson_resources").select("*").eq("lesson_id", lesson.id).order("sort_order").order("created_at"),
  ]);
  if (!weekResult.data) notFound();
  const week = weekResult.data as CourseWeek;
  const resources = (resourcesResult.data ?? []) as LessonResource[];
  const resourcesWithUrls = await Promise.all(
    resources.map(async (resource) => {
      const { data } = await supabase.storage.from("lesson-resources").createSignedUrl(resource.storage_path, 3600);
      return { ...resource, downloadUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <article>
        <Link href="/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={16} /> Bài giảng theo tuần</Link>

        <header className="mt-5 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-sm font-semibold text-emerald-300">TUẦN {week.week_number} · BÀI {lesson.sort_order + 1}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{lesson.title}</h1>
          {lesson.summary ? <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{lesson.summary}</p> : null}
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-9">
            <MarkdownContent content={lesson.content} />
          </section>

          <aside className="h-fit rounded-2xl border border-slate-900/10 bg-white p-5 xl:sticky xl:top-8">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FileText size={19} /></span><div><h2 className="font-semibold">Tài liệu bài học</h2><p className="text-xs text-slate-500">{resources.length} file đính kèm</p></div></div>
            <div className="mt-5 space-y-3">
              {resourcesWithUrls.length ? resourcesWithUrls.map((resource) => (
                resource.downloadUrl ? (
                  <a key={resource.id} href={resource.downloadUrl} target="_blank" rel="noreferrer" className="group block rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{resource.title}</div><div className="mt-1 truncate text-xs text-slate-500">{resource.file_name} · {formatFileSize(resource.file_size)}</div></div><Download size={16} className="shrink-0 text-slate-400 group-hover:text-emerald-700" /></div></a>
                ) : null
              )) : <p className="text-sm leading-6 text-slate-500">Bài này chưa có tài liệu đính kèm.</p>}
            </div>
          </aside>
        </div>
      </article>
    </AppShell>
  );
}
