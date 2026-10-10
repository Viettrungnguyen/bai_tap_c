import Link from "next/link";
import { ArrowLeft, ChevronDown, Code2, Gauge, Lightbulb, MemoryStick } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { Problem, ProblemExample, ProblemHint } from "@/lib/types";

export const metadata = { title: "Chi tiết bài tập" };
export const instant = false;

export default async function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  const [{ slug }, { supabase, user, profile }] = await Promise.all([params, requireUser()]);
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

  return (
    <AppShell email={user.email} isAdmin={profile?.role === "admin"}>
      <article>
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
              <Code2 size={22} />
              <h2 className="mt-5 text-xl font-semibold">Sẵn sàng viết code?</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                Trình soạn code và chức năng chạy thử sẽ được tích hợp ở phần tiếp theo.
              </p>
              <span className="mt-5 inline-flex rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold">
                Sắp có trong phần 3
              </span>
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
