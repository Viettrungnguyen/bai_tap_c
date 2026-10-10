import Link from "next/link";
import { ArrowLeft, BookOpenText, CirclePlus, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";

import { addCourseMember, createClass, removeCourseMember, setCourseStatus } from "@/app/admin/courses/actions";
import { AppShell } from "@/components/app-shell";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import type { Course, CourseClass, CourseMember, Profile } from "@/lib/types";

export const metadata = { title: "Chi tiết khóa học" };
export const instant = false;
const field = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export default async function CourseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const [{ id }, feedback, { supabase, user }] = await Promise.all([params, searchParams, requireAdmin()]);
  const [courseResult, classesResult, profilesResult] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle(),
    supabase.from("course_classes").select("*").eq("course_id", id).order("created_at"),
    supabase.from("profiles").select("id, full_name, username, email, role").order("full_name"),
  ]);
  if (!courseResult.data) notFound();
  const course = courseResult.data as Course;
  const classes = (classesResult.data ?? []) as CourseClass[];
  const profiles = (profilesResult.data ?? []) as Pick<Profile, "id" | "full_name" | "username" | "email" | "role">[];
  const memberResult = classes.length ? await supabase.from("course_members").select("*").in("class_id", classes.map((item) => item.id)) : { data: [] };
  const members = (memberResult.data ?? []) as CourseMember[];
  const statusAction = setCourseStatus.bind(null, id);
  const classAction = createClass.bind(null, id);
  const memberAction = addCourseMember.bind(null, id);

  return <AppShell email={user.email} isAdmin><section className="space-y-8"><div><Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16} /> Khóa học</Link><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-emerald-700">{course.subject || "KHÓA HỌC"}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{course.title}</h1><p className="mt-3 text-slate-600">{course.description || "Chưa có mô tả."}</p></div><Link href={`/admin/course?course=${id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white"><BookOpenText size={17} /> Tuần & bài giảng</Link></div></div><FeedbackBanner {...feedback} />
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-2xl border border-slate-900/10 bg-white p-6"><h2 className="text-xl font-semibold">Trạng thái khóa học</h2><form action={statusAction} className="mt-5 flex gap-3"><select name="status" defaultValue={course.status} className={`${field} mt-0`}><option value="draft">Bản nháp</option><option value="published">Đang mở</option><option value="archived">Đã lưu trữ</option></select><SubmitButton className="rounded-xl bg-slate-950 px-5 font-semibold text-white">Lưu</SubmitButton></form></article><article className="rounded-2xl border border-slate-900/10 bg-white p-6"><h2 className="text-xl font-semibold">Tạo lớp</h2><form action={classAction} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Tên lớp<input name="name" required className={field} /></label><label className="text-sm font-semibold">Mã lớp<input name="code" required className={field} /></label><label className="text-sm font-semibold">Ngày bắt đầu<input name="startsOn" type="date" className={field} /></label><label className="text-sm font-semibold">Ngày kết thúc<input name="endsOn" type="date" className={field} /></label><label className="text-sm font-semibold sm:col-span-2">Mô tả<textarea name="description" rows={2} className={field} /></label><SubmitButton className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 font-semibold text-white sm:col-span-2"><CirclePlus size={17} /> Tạo lớp</SubmitButton></form></article></div>
    <div><h2 className="text-2xl font-semibold">Các lớp trong khóa</h2><div className="mt-5 space-y-5">{classes.map((item) => { const classMembers = members.filter((member) => member.class_id === item.id); return <article key={item.id} className="rounded-2xl border border-slate-900/10 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{item.name}</h3><p className="mt-1 text-sm text-slate-500">Mã {item.code} · {classMembers.length} thành viên</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.status === "active" ? "Đang hoạt động" : "Lưu trữ"}</span></div><form action={memberAction} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_150px_auto]"><input type="hidden" name="classId" value={item.id} /><select name="userId" required className={`${field} mt-0`}><option value="">Chọn học viên</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.username || profile.email}</option>)}</select><select name="role" className={`${field} mt-0`}><option value="student">Học viên</option><option value="instructor">Giảng viên</option></select><SubmitButton className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-semibold text-white"><UserPlus size={16} /> Thêm</SubmitButton></form>{classMembers.length ? <div className="mt-4 flex flex-wrap gap-2">{classMembers.map((member) => { const profile = profiles.find((entry) => entry.id === member.user_id); const remove = removeCourseMember.bind(null, id, member.id); return <form key={member.id} action={remove}><button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-700" title="Bấm để xóa khỏi lớp">{profile?.full_name || profile?.username || "Thành viên"} · {member.role === "student" ? "học viên" : "giảng viên"}</button></form>; })}</div> : null}</article>; })}{!classes.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Chưa có lớp học.</div> : null}</div></div>
  </section></AppShell>;
}
