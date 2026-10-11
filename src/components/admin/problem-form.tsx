"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import type { Course, Problem } from "@/lib/types";

type ProblemFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  courses: Course[];
  defaultCourseId?: string;
  problem?: Problem;
  submitLabel: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
const labelClass = "block text-sm font-semibold text-slate-700";

export function ProblemForm({ action, courses, defaultCourseId, problem, submitLabel }: ProblemFormProps) {
  const [slug, setSlug] = useState(problem?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(problem?.slug));

  return (
    <form action={action} className="space-y-7">
      <label className={labelClass}>
        Khóa học
        <select name="courseId" required defaultValue={problem?.course_id ?? defaultCourseId ?? ""} className={inputClass}>
          <option value="">Chọn khóa học</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <label className={labelClass}>
          Tên bài
          <input
            name="title"
            required
            minLength={3}
            maxLength={160}
            defaultValue={problem?.title}
            placeholder="Ví dụ: Tính tổng hai số"
            className={inputClass}
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={slug}
            placeholder="tinh-tong-hai-so"
            className={inputClass}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </label>
      </div>

      <label className={labelClass}>
        Nội dung đề bài
        <textarea
          name="description"
          required
          minLength={10}
          rows={10}
          defaultValue={problem?.description}
          placeholder="Mô tả yêu cầu, ràng buộc và các lưu ý của bài..."
          className={`${inputClass} resize-y font-sans leading-7`}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Mô tả input
          <textarea
            name="inputDescription"
            rows={5}
            defaultValue={problem?.input_description}
            placeholder="Dòng đầu gồm..."
            className={`${inputClass} resize-y leading-7`}
          />
        </label>
        <label className={labelClass}>
          Mô tả output
          <textarea
            name="outputDescription"
            rows={5}
            defaultValue={problem?.output_description}
            placeholder="In ra..."
            className={`${inputClass} resize-y leading-7`}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={labelClass}>
          Độ khó
          <select
            name="difficulty"
            defaultValue={problem?.difficulty ?? "easy"}
            className={inputClass}
          >
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </label>
        <label className={labelClass}>
          Thời gian (ms)
          <input
            name="timeLimitMs"
            type="number"
            min={100}
            max={30000}
            step={100}
            defaultValue={problem?.time_limit_ms ?? 1000}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Bộ nhớ (KB)
          <input
            name="memoryLimitKb"
            type="number"
            min={16384}
            max={1048576}
            step={1024}
            defaultValue={problem?.memory_limit_kb ?? 131072}
            className={inputClass}
          />
        </label>
      </div>

      <fieldset>
        <legend className={labelClass}>Ngôn ngữ cho phép</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            ["c11", "C11"],
            ["cpp17", "C++17"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                name="allowedLanguages"
                value={value}
                defaultChecked={problem ? problem.allowed_languages.includes(value) : true}
                className="h-4 w-4 accent-emerald-700"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700">
        <Save size={18} /> {submitLabel}
      </SubmitButton>
    </form>
  );
}
