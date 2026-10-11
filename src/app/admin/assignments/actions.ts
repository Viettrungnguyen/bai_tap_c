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

function slugify(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return `${base || "bai-giao"}-${crypto.randomUUID().slice(0, 8)}`;
}

const schema = z.object({
  courseId: z.uuid(),
  classId: z.union([z.uuid(), z.literal("")]),
  weekId: z.union([z.uuid(), z.literal("")]),
  problemId: z.union([z.uuid(), z.literal("")]),
  title: z.string().min(3).max(160),
  description: z.string().max(5000),
  instructions: z.string().max(20000),
  assignmentType: z.enum(["coding", "file", "text"]),
  dueAt: z.string(),
  maxFiles: z.coerce.number().int().min(1).max(10),
  maxFileSizeMb: z.coerce.number().int().min(1).max(50),
});

function assignmentInput(formData: FormData) {
  return {
    courseId: value(formData, "courseId"),
    classId: value(formData, "classId"),
    weekId: value(formData, "weekId"),
    problemId: value(formData, "problemId"),
    title: value(formData, "title"),
    description: value(formData, "description"),
    instructions: value(formData, "instructions"),
    assignmentType: value(formData, "assignmentType"),
    dueAt: value(formData, "dueAt"),
    maxFiles: value(formData, "maxFiles") || "1",
    maxFileSizeMb: value(formData, "maxFileSizeMb") || "10",
  };
}

function extensions(formData: FormData) {
  return value(formData, "allowedExtensions")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((item) => (item.startsWith(".") ? item.toLowerCase() : `.${item.toLowerCase()}`));
}

function payload(data: z.infer<typeof schema>, formData: FormData) {
  return {
    course_id: data.courseId,
    class_id: data.classId || null,
    week_id: data.weekId || null,
    problem_id: data.assignmentType === "coding" ? data.problemId || null : null,
    title: data.title,
    description: data.description,
    instructions: data.instructions,
    assignment_type: data.assignmentType,
    due_at: data.dueAt ? new Date(data.dueAt).toISOString() : null,
    allowed_extensions: extensions(formData),
    max_files: data.maxFiles,
    max_file_size: data.maxFileSizeMb * 1024 * 1024,
  };
}

function validateCoding(data: z.infer<typeof schema>) {
  if (data.assignmentType === "coding" && !data.problemId) {
    go("/admin/assignments", "error", "Bài coding cần liên kết với một đề trong ngân hàng của khóa học.");
  }
}

export async function createAssignment(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = schema.safeParse(assignmentInput(formData));
  if (!parsed.success) go("/admin/assignments", "error", "Thông tin bài giao không hợp lệ.");
  validateCoding(parsed.data);

  const { error } = await supabase.from("assignments").insert({
    ...payload(parsed.data, formData),
    slug: slugify(parsed.data.title),
    status: "draft",
    created_by: user.id,
  });
  if (error) go("/admin/assignments", "error", "Không thể tạo bài giao. Kiểm tra lớp, tuần và đề có thuộc đúng khóa học.");
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
  go("/admin/assignments", "message", "Đã tạo bản nháp bài giao.");
}

export async function updateAssignment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().safeParse(value(formData, "assignmentId"));
  const parsed = schema.safeParse(assignmentInput(formData));
  if (!id.success || !parsed.success) go("/admin/assignments", "error", "Thông tin bài giao không hợp lệ.");
  validateCoding(parsed.data);

  const { error } = await supabase
    .from("assignments")
    .update(payload(parsed.data, formData))
    .eq("id", id.data);
  if (error) go("/admin/assignments", "error", "Không thể lưu bài giao. Kiểm tra lớp, tuần và đề có thuộc đúng khóa học.");
  revalidatePath("/admin/assignments");
  revalidatePath(`/assignments/${id.data}`);
  revalidatePath("/dashboard");
  go("/admin/assignments", "message", "Đã cập nhật bài giao.");
}

export async function setAssignmentStatus(assignmentId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(assignmentId);
  const status = z.enum(["draft", "published", "archived"]).safeParse(value(formData, "status"));
  if (!status.success) go("/admin/assignments", "error", "Trạng thái không hợp lệ.");
  const { error } = await supabase.from("assignments").update({ status: status.data }).eq("id", id);
  if (error) go("/admin/assignments", "error", "Không thể cập nhật bài giao.");
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
  go("/admin/assignments", "message", "Đã cập nhật trạng thái bài giao.");
}
