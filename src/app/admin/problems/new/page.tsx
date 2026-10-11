import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createProblem } from "@/app/admin/problems/actions";
import { AppShell } from "@/components/app-shell";
import { ProblemForm } from "@/components/admin/problem-form";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAdmin } from "@/lib/auth";
import type { Course } from "@/lib/types";

export const metadata = { title: "Tạo bài tập" };
export const instant = false;

type NewProblemPageProps = {
  searchParams: Promise<{ error?: string; course?: string }>;
};

export default async function NewProblemPage({ searchParams }: NewProblemPageProps) {
  const [{ supabase, user }, feedback] = await Promise.all([requireAdmin(), searchParams]);
  const { data } = await supabase.from("courses").select("*").order("title");
  const courses = (data ?? []) as Course[];

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <Link
          href="/admin/problems"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} /> Danh sách bài tập
        </Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">Tạo bài tập mới</h1>
        <p className="mt-3 text-slate-600">
          Bài mới luôn được lưu ở trạng thái bản nháp cho đến khi bạn xuất bản.
        </p>

        <div className="mt-8">
          <FeedbackBanner error={feedback.error} />
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <ProblemForm action={createProblem} courses={courses} defaultCourseId={feedback.course} submitLabel="Tạo bản nháp" />
        </div>
      </section>
    </AppShell>
  );
}
