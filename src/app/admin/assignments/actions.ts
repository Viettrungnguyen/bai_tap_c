"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";

function value(data: FormData, key: string) { const item = data.get(key); return typeof item === "string" ? item.trim() : ""; }
function go(path: string, key: "error" | "message", message: string): never { redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`); }

const schema = z.object({
  courseId: z.uuid(), classId: z.union([z.uuid(), z.literal("")]), weekId: z.union([z.uuid(), z.literal("")]),
  problemId: z.union([z.uuid(), z.literal("")]), title: z.string().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(5000),
  instructions: z.string().max(20000), assignmentType: z.enum(["coding", "file", "text"]),
  dueAt: z.string(), maxFiles: z.coerce.number().int().min(1).max(10), maxFileSizeMb: z.coerce.number().int().min(1).max(50),
});

export async function createAssignment(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = schema.safeParse({ courseId: value(formData, "courseId"), classId: value(formData, "classId"), weekId: value(formData, "weekId"), problemId: value(formData, "problemId"), title: value(formData, "title"), slug: value(formData, "slug"), description: value(formData, "description"), instructions: value(formData, "instructions"), assignmentType: value(formData, "assignmentType"), dueAt: value(formData, "dueAt"), maxFiles: value(formData, "maxFiles") || "1", maxFileSizeMb: value(formData, "maxFileSizeMb") || "10" });
  if (!parsed.success) go("/admin/assignments", "error", "Thông tin bài giao không hợp lệ.");
  if (parsed.data.assignmentType === "coding" && !parsed.data.problemId) go("/admin/assignments", "error", "Bài coding cần liên kết với một đề lập trình.");
  const extensions = value(formData, "allowedExtensions").split(/[\s,]+/).filter(Boolean).map((item) => item.startsWith(".") ? item.toLowerCase() : `.${item.toLowerCase()}`);
  const { error } = await supabase.from("assignments").insert({ course_id: parsed.data.courseId, class_id: parsed.data.classId || null, week_id: parsed.data.weekId || null, problem_id: parsed.data.problemId || null, title: parsed.data.title, slug: parsed.data.slug, description: parsed.data.description, instructions: parsed.data.instructions, assignment_type: parsed.data.assignmentType, status: "draft", due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null, allowed_extensions: extensions, max_files: parsed.data.maxFiles, max_file_size: parsed.data.maxFileSizeMb * 1024 * 1024, created_by: user.id });
  if (error) go("/admin/assignments", "error", error.message.includes("assignments_slug_key") ? "Slug bài giao đã tồn tại." : "Không thể tạo bài giao. Kiểm tra lớp/tuần có thuộc đúng khóa học.");
  revalidatePath("/admin/assignments"); revalidatePath("/dashboard"); go("/admin/assignments", "message", "Đã tạo bản nháp bài giao.");
}

export async function setAssignmentStatus(assignmentId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(assignmentId);
  const status = z.enum(["draft", "published", "archived"]).safeParse(value(formData, "status"));
  if (!status.success) go("/admin/assignments", "error", "Trạng thái không hợp lệ.");
  const { error } = await supabase.from("assignments").update({ status: status.data }).eq("id", id);
  if (error) go("/admin/assignments", "error", "Không thể cập nhật bài giao.");
  revalidatePath("/admin/assignments"); revalidatePath("/dashboard"); go("/admin/assignments", "message", "Đã cập nhật trạng thái bài giao.");
}
