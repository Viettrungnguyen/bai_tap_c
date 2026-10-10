"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";

function value(data: FormData, key: string) {
  const item = data.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function go(path: string, key: "error" | "message", message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`);
}

const courseSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  subject: z.string().max(120),
  description: z.string().max(5000),
});

export async function createCourse(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = courseSchema.safeParse({ title: value(formData, "title"), slug: value(formData, "slug"), subject: value(formData, "subject"), description: value(formData, "description") });
  if (!parsed.success) go("/admin/courses", "error", "Thông tin khóa học không hợp lệ.");
  const { data, error } = await supabase.from("courses").insert({ ...parsed.data, status: "draft", created_by: user.id }).select("id").single();
  if (error || !data) go("/admin/courses", "error", error?.message.includes("courses_slug_key") ? "Slug khóa học đã tồn tại." : "Không thể tạo khóa học.");
  revalidatePath("/admin/courses");
  go(`/admin/courses/${data.id}`, "message", "Đã tạo khóa học.");
}

export async function setCourseStatus(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(courseId);
  const status = z.enum(["draft", "published", "archived"]).safeParse(value(formData, "status"));
  if (!status.success) go(`/admin/courses/${id}`, "error", "Trạng thái không hợp lệ.");
  const { error } = await supabase.from("courses").update({ status: status.data }).eq("id", id);
  if (error) go(`/admin/courses/${id}`, "error", "Không thể cập nhật khóa học.");
  revalidatePath("/admin/courses"); revalidatePath("/dashboard"); revalidatePath("/lessons");
  go(`/admin/courses/${id}`, "message", "Đã cập nhật trạng thái khóa học.");
}

const classSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().max(2000),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
});

export async function createClass(courseId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = z.uuid().parse(courseId);
  const path = `/admin/courses/${id}`;
  const parsed = classSchema.safeParse({ name: value(formData, "name"), code: value(formData, "code"), description: value(formData, "description"), startsOn: value(formData, "startsOn") || undefined, endsOn: value(formData, "endsOn") || undefined });
  if (!parsed.success) go(path, "error", "Thông tin lớp học không hợp lệ.");
  const { error } = await supabase.from("course_classes").insert({ course_id: id, name: parsed.data.name, code: parsed.data.code, description: parsed.data.description, starts_on: parsed.data.startsOn ?? null, ends_on: parsed.data.endsOn ?? null, created_by: user.id });
  if (error) go(path, "error", error.message.includes("course_classes_course_id_code_key") ? "Mã lớp đã tồn tại trong khóa học." : "Không thể tạo lớp học.");
  revalidatePath(path); go(path, "message", "Đã tạo lớp học.");
}

export async function addCourseMember(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const course = z.uuid().parse(courseId);
  const classId = z.uuid().safeParse(value(formData, "classId"));
  const userId = z.uuid().safeParse(value(formData, "userId"));
  const role = z.enum(["student", "instructor"]).safeParse(value(formData, "role"));
  const path = `/admin/courses/${course}`;
  if (!classId.success || !userId.success || !role.success) go(path, "error", "Thành viên hoặc lớp học không hợp lệ.");
  const { error } = await supabase.from("course_members").upsert({ class_id: classId.data, user_id: userId.data, role: role.data }, { onConflict: "class_id,user_id" });
  if (error) go(path, "error", "Không thể thêm thành viên vào lớp.");
  revalidatePath(path); revalidatePath("/dashboard"); go(path, "message", "Đã cập nhật thành viên lớp học.");
}

export async function removeCourseMember(courseId: string, memberId: string) {
  const { supabase } = await requireAdmin();
  const course = z.uuid().parse(courseId);
  const member = z.uuid().parse(memberId);
  const path = `/admin/courses/${course}`;
  const { error } = await supabase.from("course_members").delete().eq("id", member);
  if (error) go(path, "error", "Không thể xóa thành viên khỏi lớp.");
  revalidatePath(path); revalidatePath("/dashboard"); go(path, "message", "Đã xóa thành viên khỏi lớp.");
}
