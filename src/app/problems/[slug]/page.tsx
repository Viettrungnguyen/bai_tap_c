import Link from "next/link";
import { ArrowLeft, ChevronDown, FileCode2, Gauge, Lightbulb, MemoryStick, UploadCloud } from "lucide-react";
import { notFound } from "next/navigation";

import { submitSourceFile } from "@/app/submissions/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import type { Problem, ProblemExample, ProblemHint } from "@/lib/types";

export const metadata = { title: "Chi tiết bài tập" };
export const instant = false;

type ProblemPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ProblemPage({ params, searchParams }: ProblemPageProps) {
  const [{ slug }, feedback, { supabase, user, profile }] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);
  const { data: problemData } = await supabase
    .from("problems")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!problemData) notFound();
  const problem = problemData as Problem;

  const [examplesResult, hintsResult] = await Promise.all([
    supabase
      .from("problem_examples")
      .select("*")
      .eq("problem_id", problem.id)
      .order("sort_order"),
    supabase
      .from("problem_hints")
      .select("*")
      .eq("problem_id", problem.id)
      .order("sort_order"),
  ]);
  const examples = (examplesResult.data ?? []) as ProblemExample[];
  const hints = (hintsResult.data ?? []) as ProblemHint[];
  const submitAction = submitSourceFile.bind(null, problem.id, problem.slug);

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <article>
        <FeedbackBanner error={feedback.error} message={feedback.message} />
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} /> Danh sách bài tập
        </Link>
        <div className="mt-5 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-300">
              {problem.difficulty === "easy" ? "Dễ" : problem.difficulty === "medium" ? "Trung bình" : "Khó"}
            </span>
            {problem.allowed_languages.map((language) => (
              <span key={language} className="rounded-full bg-white/10 px-3 py-1.5 text-slate-300">
                {language === "c11" ? "C11" : "C++17"}
              </span>
            ))}
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{problem.title}</h1>
          <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Gauge size={17} /> {problem.time_limit_ms} ms
            </span>
            <span className="inline-flex items-center gap-2">
              <MemoryStick size={17} /> {Math.round(problem.memory_limit_kb / 1024)} MB
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Đề bài</h2>
              <div className="mt-4 whitespace-pre-wrap leading-8 text-slate-700">{problem.description}</div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <DescriptionBlock title="Dữ liệu vào" content={problem.input_description} />
              <DescriptionBlock title="Kết quả" content={problem.output_description} />
            </div>

            {examples.map((example, index) => (
              <section key={example.id} className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
                <div className="border-b border-slate-100 px-6 py-4 font-semibold">Ví dụ {index + 1}</div>
                <div className="grid md:grid-cols-2">
                  <CodeBlock label="Input" value={example.input} />
                  <CodeBlock label="Output" value={example.output} border />
                </div>
                {example.explanation ? (
                  <div className="border-t border-slate-100 px-6 py-4 text-sm leading-6 text-slate-600">
                    <strong className="text-slate-800">Giải thích:</strong> {example.explanation}
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <Lightbulb size={18} />
                </span>
                <h2 className="font-semibold">Gợi ý</h2>
              </div>
              <div className="mt-4 space-y-2">
                {hints.length ? (
                  hints.map((hint, index) => (
                    <details key={hint.id} className="group rounded-xl border border-slate-200">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
                        Gợi ý {index + 1}
                        <ChevronDown size={16} className="transition group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
                        {hint.content}
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-500">Bài này chưa có gợi ý.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-emerald-700 p-5 text-white">
              <FileCode2 size={22} />
              <h2 className="mt-5 text-xl font-semibold">Nộp file code</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                Chọn file nguồn đã viết. Hệ thống lưu code để admin review, không chạy chương trình.
              </p>
              <form action={submitAction} className="mt-5">
                <label className="block cursor-pointer rounded-xl border border-dashed border-white/35 bg-white/10 p-4 text-center transition hover:bg-white/15">
                  <UploadCloud className="mx-auto" size={22} />
                  <span className="mt-2 block text-sm font-semibold">Chọn file .c hoặc .cpp</span>
                  <span className="mt-1 block text-xs text-emerald-100/70">Tối đa 256 KB</span>
                  <input
                    type="file"
                    name="sourceFile"
                    accept=".c,.cc,.cpp,.cxx,text/x-c,text/x-c++"
                    required
                    className="mt-3 block w-full text-xs text-emerald-50 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800"
                  />
                </label>
                <SubmitButton
                  pendingLabel="Đang tải lên..."
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  <UploadCloud size={17} /> Nộp bài
                </SubmitButton>
              </form>
            </section>
          </aside>
        </div>
      </article>
    </AppShell>
  );
}

function DescriptionBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-2xl border border-slate-900/10 bg-white p-6">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {content || "Không có mô tả riêng."}
      </div>
    </section>
  );
}

function CodeBlock({ label, value, border = false }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`p-6 ${border ? "border-t border-slate-100 md:border-l md:border-t-0" : ""}`}>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-200">
        <code>{value || "(trống)"}</code>
      </pre>
    </div>
  );
}
