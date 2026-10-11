import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileX2,
  GraduationCap,
  Layers3,
  Users,
} from "lucide-react";

import { createAssignment, setAssignmentStatus } from "@/app/admin/assignments/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Assignment, Course, CourseClass, CourseMember, CourseWeek, Problem, SubmissionStatus } from "@/lib/types";

export const metadata = { title: "Quản lý bài giao" };
export const instant = false;

const field =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

const assignmentTypeLabel = {
  coding: "Coding",
  file: "Nộp file",
  text: "Bài text/file",
};

const statusLabel = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
};

type SubmissionRow = {
  assignment_id: string;
  user_id: string;
  status: SubmissionStatus;
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ supabase, user }, feedback] = await Promise.all([requireAdmin(), searchParams]);
  const [
    assignmentsResult,
    coursesResult,
    classesResult,
    weeksResult,
    problemsResult,
    membersResult,
    submissionsResult,
  ] = await Promise.all([
    supabase.from("assignments").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*").order("title"),
    supabase.from("course_classes").select("*").order("name"),
    supabase.from("course_weeks").select("*").order("week_number"),
    supabase.from("problems").select("*").order("title"),
    supabase.from("course_members").select("*").eq("role", "student"),
    supabase.from("submissions").select("assignment_id, user_id, status"),
  ]);

  const assignments = (assignmentsResult.data ?? []) as Assignment[];
  const courses = (coursesResult.data ?? []) as Course[];
  const classes = (classesResult.data ?? []) as CourseClass[];
  const weeks = (weeksResult.data ?? []) as CourseWeek[];
  const problems = (problemsResult.data ?? []) as Problem[];
  const members = (membersResult.data ?? []) as CourseMember[];
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];
  const publishedCount = assignments.filter((item) => item.status === "published").length;
  const assignmentsWithSubmissions = new Set(submissions.map((item) => item.assignment_id)).size;

  const learnerIdsFor = (assignment: Assignment) => {
    const classIds = assignment.class_id
      ? new Set([assignment.class_id])
      : new Set(classes.filter((item) => item.course_id === assignment.course_id).map((item) => item.id));
    return new Set(members.filter((item) => classIds.has(item.class_id)).map((item) => item.user_id));
  };

  const renderAssignment = (assignment: Assignment) => {
    const classroom = classes.find((item) => item.id === assignment.class_id);
    const learnerIds = learnerIdsFor(assignment);
    const assignmentSubmissions = submissions.filter((item) => item.assignment_id === assignment.id);
    const submittedIds = new Set(
      assignmentSubmissions.filter((item) => learnerIds.has(item.user_id)).map((item) => item.user_id),
    );
    const correctIds = new Set(
      assignmentSubmissions
        .filter((item) => learnerIds.has(item.user_id) && item.status === "correct")
        .map((item) => item.user_id),
    );
    const notStarted = Math.max(learnerIds.size - submittedIds.size, 0);
    const percent = learnerIds.size ? Math.round((submittedIds.size / learnerIds.size) * 100) : 0;
    const statusAction = setAssignmentStatus.bind(null, assignment.id);

    return (
      <article
        key={assignment.id}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-900/[0.05]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {assignmentTypeLabel[assignment.assignment_type]}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  assignment.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : assignment.status === "draft"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {statusLabel[assignment.status]}
              </span>
            </div>
            <h4 className="mt-3 text-lg font-semibold text-slate-950">{assignment.title}</h4>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} /> {classroom?.name || "Toàn khóa"}
              </span>
              {assignment.due_at ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={14} /> {formatDateTime(assignment.due_at)}
                </span>
              ) : null}
            </p>
          </div>
          <Link
            href={`/assignments/${assignment.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Chi tiết <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tiến độ nộp bài</span>
            <span className="text-sm font-bold text-slate-800">
              {submittedIds.size}/{learnerIds.size} học viên
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white px-2 py-2">
              <div className="text-base font-bold text-blue-700">{submittedIds.size}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Đã làm</div>
            </div>
            <div className="rounded-lg bg-white px-2 py-2">
              <div className="text-base font-bold text-rose-600">{notStarted}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Chưa làm</div>
            </div>
            <div className="rounded-lg bg-white px-2 py-2">
              <div className="text-base font-bold text-emerald-700">{correctIds.size}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Hoàn thành</div>
            </div>
          </div>
          {!learnerIds.size ? (
            <p className="mt-3 text-xs text-amber-700">Khóa/lớp này chưa có học viên để tính tiến độ.</p>
          ) : null}
        </div>

        <form action={statusAction} className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <select
            name="status"
            defaultValue={assignment.status}
            aria-label={`Trạng thái ${assignment.title}`}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Xuất bản</option>
            <option value="archived">Lưu trữ</option>
          </select>
          <SubmitButton className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
            Cập nhật
          </SubmitButton>
        </form>
      </article>
    );
  };

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">BÀI GIAO ĐA MÔN</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950">Quản lý bài giao</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Theo dõi bài giao theo từng khóa, từng tuần và tình trạng làm bài của học viên.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3 sm:gap-3">
            {[
              { label: "Tổng bài", value: assignments.length, icon: ClipboardList, style: "text-blue-700 bg-blue-50" },
              { label: "Đang mở", value: publishedCount, icon: FileCheck2, style: "text-emerald-700 bg-emerald-50" },
              { label: "Có bài nộp", value: assignmentsWithSubmissions, icon: CheckCircle2, style: "text-violet-700 bg-violet-50" },
            ].map(({ label, value, icon: Icon, style }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:min-w-36">
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style}`}><Icon size={17} /></span>
                  <div><div className="text-xl font-bold leading-none">{value}</div><div className="mt-1 text-[11px] text-slate-500">{label}</div></div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-7"><FeedbackBanner {...feedback} /></div>

        <details className="group mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <span className="flex items-center gap-3 font-semibold text-slate-900">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-emerald-300"><CirclePlus size={18} /></span>
              Tạo bài giao mới
            </span>
            <ChevronDown size={19} className="text-slate-400 transition group-open:rotate-180" />
          </summary>
          <form action={createAssignment} className="grid gap-5 border-t border-slate-100 p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm font-semibold">Khóa học<select name="courseId" required className={field}><option value="">Chọn khóa</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label className="block text-sm font-semibold">Lớp (tùy chọn)<select name="classId" className={field}><option value="">Toàn khóa</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {courses.find((course) => course.id === item.course_id)?.title}</option>)}</select></label>
            <label className="block text-sm font-semibold">Tuần (tùy chọn)<select name="weekId" className={field}><option value="">Không gắn tuần</option>{weeks.map((item) => <option key={item.id} value={item.id}>{courses.find((course) => course.id === item.course_id)?.title} · Tuần {item.week_number}: {item.title}</option>)}</select></label>
            <label className="block text-sm font-semibold">Loại bài<select name="assignmentType" className={field}><option value="file">Nộp file</option><option value="coding">Coding</option><option value="text">Bài text/file</option></select></label>
            <label className="block text-sm font-semibold">Tên bài<input name="title" required className={field} /></label>
            <label className="block text-sm font-semibold">Slug<input name="slug" required placeholder="bai-tap-tuan-01" className={field} /></label>
            <label className="block text-sm font-semibold">Đề code (nếu là coding)<select name="problemId" className={field}><option value="">Không liên kết</option>{problems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label className="block text-sm font-semibold">Hạn nộp<input name="dueAt" type="datetime-local" className={field} /></label>
            <label className="block text-sm font-semibold lg:col-span-2">Mô tả<textarea name="description" rows={3} className={field} /></label>
            <label className="block text-sm font-semibold lg:col-span-2">Yêu cầu<textarea name="instructions" rows={3} className={field} /></label>
            <label className="block text-sm font-semibold xl:col-span-2">Đuôi file cho phép<input name="allowedExtensions" placeholder=".c, .cpp hoặc .pdf, .zip" className={field} /></label>
            <label className="block text-sm font-semibold">Số file tối đa<input name="maxFiles" type="number" min={1} max={10} defaultValue={1} className={field} /></label>
            <label className="block text-sm font-semibold">MB mỗi file<input name="maxFileSizeMb" type="number" min={1} max={50} defaultValue={10} className={field} /></label>
            <div className="flex justify-end lg:col-span-2 xl:col-span-4">
              <SubmitButton className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-semibold text-white transition hover:bg-emerald-700"><CirclePlus size={17} /> Tạo bản nháp</SubmitButton>
            </div>
          </form>
        </details>

        <div className="mt-8 space-y-8">
          {courses.map((course) => {
            const courseAssignments = assignments.filter((item) => item.course_id === course.id);
            const courseWeeks = weeks.filter((item) => item.course_id === course.id);
            const withoutWeek = courseAssignments.filter((item) => !item.week_id);
            if (!courseAssignments.length && !courseWeeks.length) return null;

            return (
              <section key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 bg-slate-950 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950"><GraduationCap size={21} /></span>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{course.subject || "Khóa học"}</p><h2 className="mt-1 text-2xl font-semibold">{course.title}</h2></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300"><Layers3 size={16} /> {courseWeeks.length} tuần · {courseAssignments.length} bài giao</div>
                </div>

                <div className="space-y-7 bg-slate-50/70 p-5 sm:p-7">
                  {courseWeeks.map((week) => {
                    const weekAssignments = courseAssignments.filter((item) => item.week_id === week.id);
                    return (
                      <section key={week.id}>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3"><span className="grid h-9 min-w-9 place-items-center rounded-xl bg-white px-2 text-sm font-bold text-emerald-700 shadow-sm">{week.week_number}</span><div><h3 className="font-semibold text-slate-900">Tuần {week.week_number}: {week.title}</h3><p className="mt-0.5 text-xs text-slate-500">{weekAssignments.length} bài giao</p></div></div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${week.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{week.status === "published" ? "Đã xuất bản" : "Bản nháp"}</span>
                        </div>
                        {weekAssignments.length ? <div className="grid gap-4 xl:grid-cols-2">{weekAssignments.map(renderAssignment)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-7 text-center text-sm text-slate-500">Tuần này chưa có bài giao.</div>}
                      </section>
                    );
                  })}

                  {withoutWeek.length ? (
                    <section>
                      <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500 shadow-sm"><BookOpenText size={17} /></span><div><h3 className="font-semibold text-slate-900">Chưa xếp tuần</h3><p className="mt-0.5 text-xs text-slate-500">{withoutWeek.length} bài giao</p></div></div>
                      <div className="grid gap-4 xl:grid-cols-2">{withoutWeek.map(renderAssignment)}</div>
                    </section>
                  ) : null}
                </div>
              </section>
            );
          })}

          {!assignments.length && !weeks.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center">
              <FileX2 className="mx-auto text-slate-400" size={32} />
              <h2 className="mt-4 text-xl font-semibold">Chưa có bài giao</h2>
              <p className="mt-2 text-slate-500">Mở biểu mẫu phía trên để tạo bài giao đầu tiên.</p>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
