import Link from "next/link";
import { Archive, ArrowLeft, Eye, FlaskConical, Lightbulb, Plus, Send, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

import {
  addExample,
  addHint,
  addTestCase,
  deleteExample,
  deleteHint,
  deleteProblem,
  deleteTestCase,
  setProblemStatus,
  updateExample,
  updateHint,
  updateProblem,
  updateTestCase,
} from "@/app/admin/problems/actions";
import { ProblemForm } from "@/components/admin/problem-form";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { Course, Problem, ProblemExample, ProblemHint, TestCase } from "@/lib/types";

export const metadata = { title: "Chỉnh sửa bài tập" };
export const instant = false;

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
const labelClass = "block text-sm font-semibold text-slate-700";

type EditProblemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function EditProblemPage({
  params,
  searchParams,
}: EditProblemPageProps) {
  const [{ id }, feedback, { supabase, user }] = await Promise.all([
    params,
    searchParams,
    requireAdmin(),
  ]);

  const { data: problemData } = await supabase
    .from("problems")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!problemData) notFound();
  const problem = problemData as Problem;

  const [examplesResult, hintsResult, testsResult, coursesResult] = await Promise.all([
    supabase
      .from("problem_examples")
      .select("*")
      .eq("problem_id", id)
      .order("sort_order"),
    supabase.from("problem_hints").select("*").eq("problem_id", id).order("sort_order"),
    supabase.from("test_cases").select("*").eq("problem_id", id).order("sort_order"),
    supabase.from("courses").select("*").order("title"),
  ]);

  const examples = (examplesResult.data ?? []) as ProblemExample[];
  const hints = (hintsResult.data ?? []) as ProblemHint[];
  const testCases = (testsResult.data ?? []) as TestCase[];
  const courses = (coursesResult.data ?? []) as Course[];
  const updateProblemAction = updateProblem.bind(null, id);
  const publishAction = setProblemStatus.bind(null, id, "published");
  const draftAction = setProblemStatus.bind(null, id, "draft");
  const archiveAction = setProblemStatus.bind(null, id, "archived");
  const deleteProblemAction = deleteProblem.bind(null, id);

  return (
    <AppShell email={user.email} isAdmin>
      <section className="space-y-8">
        <div>
          <Link
            href="/admin/problems"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={17} /> Danh sách bài tập
          </Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-[-0.04em]">{problem.title}</h1>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {problem.status}
                </span>
              </div>
              <p className="mt-3 text-slate-600">
                {examples.length} ví dụ · {hints.length} gợi ý · {testCases.length} test case
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {problem.status === "published" ? (
                <Link
                  href={`/problems/${problem.slug}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  <Eye size={17} /> Xem bài
                </Link>
              ) : null}
              {problem.status !== "published" ? (
                <form action={publishAction}>
                  <SubmitButton
                    pendingLabel="Đang xuất bản..."
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    <Send size={17} /> Xuất bản
                  </SubmitButton>
                </form>
              ) : (
                <form action={draftAction}>
                  <SubmitButton className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
                    Chuyển về nháp
                  </SubmitButton>
                </form>
              )}
              {problem.status !== "archived" ? (
                <form action={archiveAction}>
                  <SubmitButton className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 hover:text-slate-950">
                    <Archive size={17} />
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          </div>
        </div>

        <FeedbackBanner error={feedback.error} message={feedback.message} />

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">NỘI DUNG</p>
            <h2 className="mt-2 text-2xl font-semibold">Thông tin bài tập</h2>
          </div>
          <ProblemForm action={updateProblemAction} courses={courses} problem={problem} submitLabel="Lưu thay đổi" />
        </section>

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <SectionHeading
            icon={<FlaskConical size={20} />}
            title="Ví dụ input/output"
            description="Các ví dụ này được hiển thị công khai trong đề bài."
          />
          <div className="mt-6 space-y-4">
            {examples.map((example, index) => {
              const updateAction = updateExample.bind(null, id, example.id);
              const deleteAction = deleteExample.bind(null, id, example.id);
              return (
                <details key={example.id} className="rounded-xl border border-slate-200 bg-slate-50" open={index === 0}>
                  <summary className="cursor-pointer px-4 py-3 font-semibold">
                    Ví dụ {index + 1} · thứ tự {example.sort_order}
                  </summary>
                  <div className="border-t border-slate-200 p-4">
                    <form action={updateAction} className="grid gap-4 sm:grid-cols-2">
                      <TextArea name="input" label="Input" defaultValue={example.input} mono />
                      <TextArea name="output" label="Output" defaultValue={example.output} mono />
                      <div className="sm:col-span-2">
                        <TextArea
                          name="explanation"
                          label="Giải thích"
                          defaultValue={example.explanation}
                        />
                      </div>
                      <OrderField defaultValue={example.sort_order} />
                      <div className="flex items-end justify-end gap-2">
                        <SubmitButton className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                          Lưu ví dụ
                        </SubmitButton>
                      </div>
                    </form>
                    <form action={deleteAction} className="mt-3 flex justify-end">
                      <ConfirmSubmitButton
                        message="Xóa ví dụ này?"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700"
                      >
                        <Trash2 size={15} /> Xóa ví dụ
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              );
            })}
          </div>
          <form action={addExample.bind(null, id)} className="mt-6 grid gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-2">
            <TextArea name="input" label="Input mới" mono />
            <TextArea name="output" label="Output mới" mono />
            <div className="sm:col-span-2">
              <TextArea name="explanation" label="Giải thích" />
            </div>
            <OrderField defaultValue={examples.length} />
            <div className="flex items-end justify-end">
              <SubmitButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">
                <Plus size={16} /> Thêm ví dụ
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-8">
          <SectionHeading
            icon={<Lightbulb size={20} />}
            title="Gợi ý"
            description="User có thể mở lần lượt các gợi ý khi cần trợ giúp."
          />
          <div className="mt-6 space-y-3">
            {hints.map((hint, index) => (
              <div key={hint.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <form action={updateHint.bind(null, id, hint.id)} className="grid gap-4 sm:grid-cols-[1fr_110px_auto]">
                  <TextArea
                    name="content"
                    label={`Gợi ý ${index + 1}`}
                    defaultValue={hint.content}
                  />
                  <OrderField defaultValue={hint.sort_order} />
                  <div className="flex items-end">
                    <SubmitButton className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                      Lưu
                    </SubmitButton>
                  </div>
                </form>
                <form action={deleteHint.bind(null, id, hint.id)} className="mt-2 flex justify-end">
                  <ConfirmSubmitButton
                    message="Xóa gợi ý này?"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700"
                  >
                    <Trash2 size={15} /> Xóa
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
          <form action={addHint.bind(null, id)} className="mt-6 grid gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-[1fr_110px_auto]">
            <TextArea name="content" label="Gợi ý mới" />
            <OrderField defaultValue={hints.length} />
            <div className="flex items-end">
              <SubmitButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">
                <Plus size={16} /> Thêm
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-900/10 bg-slate-950 p-6 text-white sm:p-8">
          <SectionHeading
            icon={<FlaskConical size={20} />}
            title="Test case chấm bài"
            description="Dữ liệu trong phần này được bảo vệ bởi RLS và không gửi xuống trình duyệt của user."
            dark
          />
          <div className="mt-6 space-y-4">
            {testCases.map((testCase, index) => (
              <details key={testCase.id} className="rounded-xl border border-white/10 bg-white/5">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-200">
                  Test {index + 1} · {testCase.score} điểm · thứ tự {testCase.sort_order}
                </summary>
                <div className="border-t border-white/10 p-4">
                  <form action={updateTestCase.bind(null, id, testCase.id)} className="grid gap-4 sm:grid-cols-2">
                    <DarkTextArea name="input" label="Input" defaultValue={testCase.input} />
                    <DarkTextArea
                      name="expectedOutput"
                      label="Expected output"
                      defaultValue={testCase.expected_output}
                    />
                    <DarkNumberField name="score" label="Điểm" defaultValue={testCase.score} step="0.01" />
                    <DarkNumberField
                      name="sortOrder"
                      label="Thứ tự"
                      defaultValue={testCase.sort_order}
                      step="1"
                    />
                    <label className="flex items-center gap-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        name="isSample"
                        defaultChecked={testCase.is_sample}
                        className="h-4 w-4 accent-emerald-400"
                      />
                      Đánh dấu là test mẫu nội bộ
                    </label>
                    <div className="flex justify-end">
                      <SubmitButton className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950">
                        Lưu test
                      </SubmitButton>
                    </div>
                  </form>
                  <form action={deleteTestCase.bind(null, id, testCase.id)} className="mt-3 flex justify-end">
                    <ConfirmSubmitButton
                      message="Xóa test case này?"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-rose-300"
                    >
                      <Trash2 size={15} /> Xóa test
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
          <form action={addTestCase.bind(null, id)} className="mt-6 grid gap-4 rounded-xl border border-dashed border-white/20 p-4 sm:grid-cols-2">
            <DarkTextArea name="input" label="Input mới" />
            <DarkTextArea name="expectedOutput" label="Expected output" />
            <DarkNumberField name="score" label="Điểm" defaultValue={0} step="0.01" />
            <DarkNumberField name="sortOrder" label="Thứ tự" defaultValue={testCases.length} step="1" />
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" name="isSample" className="h-4 w-4 accent-emerald-400" />
              Đánh dấu là test mẫu nội bộ
            </label>
            <div className="flex justify-end">
              <SubmitButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950">
                <Plus size={16} /> Thêm test
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h2 className="font-semibold text-rose-900">Vùng nguy hiểm</h2>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            Xóa bài sẽ xóa toàn bộ ví dụ, gợi ý và test case liên quan. Thao tác này không thể hoàn tác.
          </p>
          <form action={deleteProblemAction} className="mt-4">
            <ConfirmSubmitButton
              message={`Xóa vĩnh viễn bài “${problem.title}”?`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800"
            >
              <Trash2 size={16} /> Xóa bài tập
            </ConfirmSubmitButton>
          </form>
        </section>
      </section>
    </AppShell>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  dark = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {icon}
      </span>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className={`mt-1 leading-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

function TextArea({
  name,
  label,
  defaultValue = "",
  mono = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  mono?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        className={`${fieldClass} resize-y ${mono ? "font-mono text-sm" : ""}`}
      />
    </label>
  );
}

function OrderField({ defaultValue }: { defaultValue: number }) {
  return (
    <label className={labelClass}>
      Thứ tự
      <input
        type="number"
        min={0}
        name="sortOrder"
        defaultValue={defaultValue}
        className={fieldClass}
      />
    </label>
  );
}

function DarkTextArea({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <textarea
        name={name}
        rows={5}
        defaultValue={defaultValue}
        className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
      />
    </label>
  );
}

function DarkNumberField({
  name,
  label,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <input
        name={name}
        type="number"
        min={0}
        step={step}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-white outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
      />
    </label>
  );
}
