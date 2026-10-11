"use client";

import { Save } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import type { Lesson } from "@/lib/types";

type LessonFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  lesson?: Lesson;
  submitLabel: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
const labelClass = "block text-sm font-semibold text-slate-700";

export function LessonForm({ action, lesson, submitLabel }: LessonFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-[1fr_120px]">
        <label className={labelClass}>
          Tên bài giảng
          <input
            name="title"
            required
            minLength={3}
            maxLength={160}
            defaultValue={lesson?.title}
            placeholder="Ví dụ: Chương trình C đầu tiên"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Thứ tự
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={lesson?.sort_order ?? 0}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Tóm tắt
        <textarea
          name="summary"
          rows={3}
          maxLength={2000}
          defaultValue={lesson?.summary}
          placeholder="Học viên sẽ học gì trong bài này?"
          className={`${inputClass} resize-y leading-7`}
        />
      </label>

      <label className={labelClass}>
        Nội dung bài giảng
        <textarea
          name="content"
          required
          minLength={10}
          rows={18}
          defaultValue={lesson?.content}
          placeholder="Nhập nội dung bài giảng. Có thể dán nội dung từ file Markdown..."
          className={`${inputClass} resize-y font-mono text-sm leading-7`}
        />
        <span className="mt-2 block text-xs font-normal text-slate-500">
          Nội dung được giữ nguyên xuống dòng khi hiển thị cho học viên.
        </span>
      </label>

      <SubmitButton className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700">
        <Save size={18} /> {submitLabel}
      </SubmitButton>
    </form>
  );
}
