"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import type { LessonStatus } from "@/lib/types";

const RESOURCE_BUCKET = "lesson-resources";

const weekSchema = z.object({
  courseId: z.uuid("Khóa học không hợp lệ."),
  weekNumber: z.coerce.number().int().min(1).max(999),
  title: z.string().trim().min(3, "Tên tuần phải có ít nhất 3 ký tự.").max(160),
  description: z.string().trim().max(5000),
});

const lessonSchema = z.object({
  title: z.string().trim().min(3, "Tên bài giảng phải có ít nhất 3 ký tự.").max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang."),
  summary: z.string().trim().max(2000),
  content: z.string().trim().min(10, "Nội dung bài giảng phải có ít nhất 10 ký tự."),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

function withMessage(path: string, key: "error" | "message", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

function databaseMessage(message: string) {
  if (message.includes("course_weeks_week_number_key")) return "Tuần này đã tồn tại.";
  if (message.includes("lessons_slug_key")) return "Slug bài giảng đã được sử dụng.";
  return "Không thể lưu dữ liệu. Vui lòng thử lại.";
}

export async function createWeek(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = weekSchema.safeParse({
    courseId: value(formData, "courseId"),
    weekNumber: value(formData, "weekNumber"),
    title: value(formData, "title"),
    description: value(formData, "description"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/course", "error", firstIssue(parsed.error)));
  }

  const { data, error } = await supabase
    .from("course_weeks")
    .insert({
      week_number: parsed.data.weekNumber,
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      created_by: user.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(withMessage("/admin/course", "error", databaseMessage(error?.message ?? "")));
  }

  revalidatePath("/admin/course");
  redirect(withMessage(`/admin/course/${data.id}`, "message", "Đã tạo tuần học mới."));
}

export async function updateWeek(weekId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(weekId);
  const returnPath = `/admin/course/${id}`;
  const parsed = weekSchema.safeParse({
    courseId: value(formData, "courseId"),
    weekNumber: value(formData, "weekNumber"),
    title: value(formData, "title"),
    description: value(formData, "description"),
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase
    .from("course_weeks")
    .update({
      week_number: parsed.data.weekNumber,
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .eq("id", id);

  if (error) redirect(withMessage(returnPath, "error", databaseMessage(error.message)));
  revalidatePath("/admin/course");
  revalidatePath(returnPath);
  revalidatePath("/lessons");
  redirect(withMessage(returnPath, "message", "Đã lưu thông tin tuần học."));
}

export async function setWeekStatus(weekId: string, status: LessonStatus) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(weekId);
  const nextStatus = z.enum(["draft", "published"]).parse(status);
  const returnPath = `/admin/course/${id}`;
  const { error } = await supabase.from("course_weeks").update({ status: nextStatus }).eq("id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể đổi trạng thái tuần học."));
  revalidatePath("/admin/course");
  revalidatePath(returnPath);
  revalidatePath("/lessons");
  redirect(withMessage(returnPath, "message", "Đã cập nhật trạng thái tuần học."));
}

export async function createLesson(weekId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = z.uuid().parse(weekId);
  const returnPath = `/admin/course/${id}`;
  const parsed = lessonSchema.safeParse({
    title: value(formData, "title"),
    slug: value(formData, "slug"),
    summary: value(formData, "summary"),
    content: value(formData, "content"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      week_id: id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      content: parsed.data.content,
      sort_order: parsed.data.sortOrder,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) redirect(withMessage(returnPath, "error", databaseMessage(error?.message ?? "")));
  revalidatePath(returnPath);
  redirect(withMessage(`/admin/course/${id}/lessons/${data.id}`, "message", "Đã tạo bản nháp bài giảng."));
}

export async function updateLesson(weekId: string, lessonId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const week = z.uuid().parse(weekId);
  const lesson = z.uuid().parse(lessonId);
  const returnPath = `/admin/course/${week}/lessons/${lesson}`;
  const parsed = lessonSchema.safeParse({
    title: value(formData, "title"),
    slug: value(formData, "slug"),
    summary: value(formData, "summary"),
    content: value(formData, "content"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));

  const { error } = await supabase
    .from("lessons")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      content: parsed.data.content,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", lesson)
    .eq("week_id", week);

  if (error) redirect(withMessage(returnPath, "error", databaseMessage(error.message)));
  revalidatePath(`/admin/course/${week}`);
  revalidatePath(returnPath);
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${parsed.data.slug}`);
  redirect(withMessage(returnPath, "message", "Đã lưu nội dung bài giảng."));
}

export async function setLessonStatus(weekId: string, lessonId: string, status: LessonStatus) {
  const { supabase } = await requireAdmin();
  const week = z.uuid().parse(weekId);
  const lesson = z.uuid().parse(lessonId);
  const nextStatus = z.enum(["draft", "published"]).parse(status);
  const returnPath = `/admin/course/${week}/lessons/${lesson}`;
  const { error } = await supabase
    .from("lessons")
    .update({ status: nextStatus })
    .eq("id", lesson)
    .eq("week_id", week);

  if (error) redirect(withMessage(returnPath, "error", "Không thể đổi trạng thái bài giảng."));
  revalidatePath(`/admin/course/${week}`);
  revalidatePath(returnPath);
  revalidatePath("/lessons");
  redirect(withMessage(returnPath, "message", "Đã cập nhật trạng thái bài giảng."));
}

export async function deleteLessonResource(weekId: string, lessonId: string, resourceId: string) {
  const { supabase } = await requireAdmin();
  const week = z.uuid().parse(weekId);
  const lesson = z.uuid().parse(lessonId);
  const resource = z.uuid().parse(resourceId);
  const returnPath = `/admin/course/${week}/lessons/${lesson}`;
  const { data } = await supabase
    .from("lesson_resources")
    .select("storage_path")
    .eq("id", resource)
    .eq("lesson_id", lesson)
    .maybeSingle();

  if (!data) redirect(withMessage(returnPath, "error", "Không tìm thấy tài liệu."));
  const { error: storageError } = await supabase.storage.from(RESOURCE_BUCKET).remove([data.storage_path]);
  if (storageError) redirect(withMessage(returnPath, "error", "Không thể xóa file trong Storage."));

  const { error } = await supabase
    .from("lesson_resources")
    .delete()
    .eq("id", resource)
    .eq("lesson_id", lesson);
  if (error) redirect(withMessage(returnPath, "error", "Không thể xóa tài liệu."));

  revalidatePath(returnPath);
  revalidatePath("/lessons");
  redirect(withMessage(returnPath, "message", "Đã xóa tài liệu."));
}
