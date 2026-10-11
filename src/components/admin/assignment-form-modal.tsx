"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CirclePlus, Pencil, X } from "lucide-react";

import { createAssignment, updateAssignment } from "@/app/admin/assignments/actions";
import { SubmitButton } from "@/components/submit-button";
import type { Assignment, Course, CourseClass, CourseWeek, Problem } from "@/lib/types";

type AssignmentFormModalProps = {
  courses: Course[];
  classes: CourseClass[];
  weeks: CourseWeek[];
  problems: Problem[];
  assignment?: Assignment;
  compact?: boolean;
};

const field =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
const label = "block text-sm font-semibold text-slate-700";

function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function AssignmentFormModal({
  courses,
  classes,
  weeks,
  problems,
  assignment,
  compact = false,
}: AssignmentFormModalProps) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(assignment?.course_id ?? courses[0]?.id ?? "");
  const [type, setType] = useState(assignment?.assignment_type ?? "file");
  const editing = Boolean(assignment);
  const courseClasses = useMemo(() => classes.filter((item) => item.course_id === courseId), [classes, courseId]);
  const courseWeeks = useMemo(() => weeks.filter((item) => item.course_id === courseId), [weeks, courseId]);
  const courseProblems = useMemo(() => problems.filter((item) => item.course_id === courseId), [problems, courseId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            : "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-emerald-700"
        }
      >
        {editing ? <Pencil size={compact ? 14 : 17} /> : <CirclePlus size={18} />}
        {editing ? "Sửa" : "Tạo bài giao"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-8">
          <button type="button" aria-label="Đóng popup" onClick={() => setOpen(false)} className="fixed inset-0" />
          <section role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/25">
            <header className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Bài giao</p>
                <h2 id="assignment-modal-title" className="mt-1 text-2xl font-semibold text-slate-950">{editing ? "Chỉnh sửa bài giao" : "Tạo bài giao mới"}</h2>
                <p className="mt-1 text-sm text-slate-500">Bạn chỉ cần nhập những thông tin học viên cần thấy.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"><X size={19} /></button>
            </header>

            <form action={editing ? updateAssignment : createAssignment} className="space-y-5 px-6 py-6 sm:px-8">
              {assignment ? <input type="hidden" name="assignmentId" value={assignment.id} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Khóa học<select name="courseId" required value={courseId} onChange={(event) => setCourseId(event.target.value)} className={field}>{!courses.length ? <option value="">Chưa có khóa học</option> : null}{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
                <label className={label}>Tuần học<select key={`${courseId}-week`} name="weekId" defaultValue={courseId === assignment?.course_id ? assignment?.week_id ?? "" : ""} className={field}><option value="">Chưa xếp tuần</option>{courseWeeks.map((item) => <option key={item.id} value={item.id}>Tuần {item.week_number}: {item.title}</option>)}</select></label>
                <label className={label}>Phạm vi lớp<select key={`${courseId}-class`} name="classId" defaultValue={courseId === assignment?.course_id ? assignment?.class_id ?? "" : ""} className={field}><option value="">Toàn khóa</option>{courseClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className={label}>Loại bài<select name="assignmentType" value={type} onChange={(event) => setType(event.target.value as Assignment["assignment_type"])} className={field}><option value="file">Nộp file</option><option value="coding">Coding</option><option value="text">Bài text/file</option></select></label>
              </div>

              {type === "coding" ? (
                <label className={label}>Đề trong ngân hàng của khóa<select key={`${courseId}-problem`} name="problemId" required defaultValue={courseId === assignment?.course_id ? assignment?.problem_id ?? "" : ""} className={field}><option value="">Chọn đề coding</option>{courseProblems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{!courseProblems.length ? <span className="mt-2 block text-xs font-normal text-amber-700">Khóa này chưa có đề coding. Hãy tạo đề trong Ngân hàng đề trước.</span> : null}</label>
              ) : <input type="hidden" name="problemId" value="" />}

              <label className={label}>Tên bài giao<input name="title" required minLength={3} maxLength={160} defaultValue={assignment?.title} placeholder="Ví dụ: Bài tập tuần 2" className={field} /></label>
              <label className={label}>Mô tả ngắn<textarea name="description" rows={3} defaultValue={assignment?.description} placeholder="Mục tiêu và nội dung chính của bài..." className={`${field} resize-y`} /></label>
              <label className={label}>Yêu cầu nộp bài<textarea name="instructions" rows={3} defaultValue={assignment?.instructions} placeholder="Yêu cầu về nội dung, cách đặt tên file..." className={`${field} resize-y`} /></label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>Hạn nộp<input name="dueAt" type="datetime-local" defaultValue={localDateTime(assignment?.due_at)} className={field} /></label>
                <div />
              </div>

              <details className="group rounded-2xl border border-slate-200 bg-slate-50 [&>summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-700">Cấu hình file nâng cao <ChevronDown size={17} className="transition group-open:rotate-180" /></summary>
                <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-3">
                  <label className={`${label} sm:col-span-3`}>Đuôi file cho phép<input name="allowedExtensions" defaultValue={assignment?.allowed_extensions.join(", ")} placeholder="Để trống để nhận mọi file" className={field} /></label>
                  <label className={label}>Số file tối đa<input name="maxFiles" type="number" min={1} max={10} defaultValue={assignment?.max_files ?? 1} className={field} /></label>
                  <label className={label}>MB mỗi file<input name="maxFileSizeMb" type="number" min={1} max={50} defaultValue={assignment ? Math.round(assignment.max_file_size / 1024 / 1024) : 10} className={field} /></label>
                </div>
              </details>

              <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
                <SubmitButton className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700">{editing ? "Lưu thay đổi" : "Tạo bản nháp"}</SubmitButton>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
