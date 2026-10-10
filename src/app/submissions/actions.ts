"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin, requireUser } from "@/lib/auth";
import type { Assignment } from "@/lib/types";

const BUCKET = "assignment-submissions";
const languageByExtension = { ".c": "c11", ".cc": "cpp17", ".cpp": "cpp17", ".cxx": "cpp17" } as const;

function withMessage(path: string, key: "error" | "message", message: string) { return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`; }
function safeFileName(name: string) { return name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255); }
function storageFileName(name: string) { return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-"); }

async function saveSubmissionFiles(assignmentId: string, files: File[], returnPath: string, includeLegacySource = false) {
  const { supabase, user } = await requireUser();
  const id = z.uuid().parse(assignmentId);
  const { data } = await supabase.from("assignments").select("*").eq("id", id).eq("status", "published").maybeSingle();
  const assignment = data as Assignment | null;
  if (!assignment) redirect(withMessage(returnPath, "error", "Bài giao không còn nhận bài nộp."));
  if (!files.length || files.some((file) => file.size === 0)) redirect(withMessage(returnPath, "error", "Vui lòng chọn file cần nộp."));
  if (files.length > assignment.max_files) redirect(withMessage(returnPath, "error", `Chỉ được nộp tối đa ${assignment.max_files} file.`));

  const checked = files.map((file) => {
    const fileName = safeFileName(file.name);
    const dot = fileName.lastIndexOf(".");
    const extension = dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
    if (!fileName || file.size > assignment.max_file_size) redirect(withMessage(returnPath, "error", `Mỗi file không được vượt quá ${Math.round(assignment.max_file_size / 1024 / 1024)} MB.`));
    if (assignment.allowed_extensions.length && !assignment.allowed_extensions.includes(extension)) redirect(withMessage(returnPath, "error", `Định dạng ${extension || "không có đuôi"} không được phép.`));
    return { file, fileName, extension };
  });

  let sourceCode: string | null = null;
  let language: "c11" | "cpp17" | null = null;
  if (includeLegacySource) {
    language = languageByExtension[checked[0].extension as keyof typeof languageByExtension] ?? null;
    if (!language) redirect(withMessage(returnPath, "error", "Chỉ chấp nhận file .c, .cc, .cpp hoặc .cxx."));
    try { sourceCode = new TextDecoder("utf-8", { fatal: true }).decode(await checked[0].file.arrayBuffer()); } catch { redirect(withMessage(returnPath, "error", "File code phải là văn bản UTF-8 hợp lệ.")); }
    if (!sourceCode.trim() || sourceCode.includes("\u0000")) redirect(withMessage(returnPath, "error", "File code trống hoặc không hợp lệ."));
  }

  const { data: submission, error: createError } = await supabase.from("submissions").insert({ user_id: user.id, assignment_id: id, problem_id: assignment.problem_id, language, file_name: includeLegacySource ? checked[0].fileName : null, source_code: sourceCode, status: "pending" }).select("id").single();
  if (createError || !submission) redirect(withMessage(returnPath, "error", "Không thể tạo bài nộp."));

  const uploadedPaths: string[] = [];
  for (const item of checked) {
    const path = `${user.id}/${submission.id}/${crypto.randomUUID()}-${storageFileName(item.fileName)}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, item.file, { contentType: item.file.type || "application/octet-stream", upsert: false });
    if (uploadError) {
      if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
      await supabase.from("submissions").delete().eq("id", submission.id);
      redirect(withMessage(returnPath, "error", "Không thể tải file lên Storage."));
    }
    uploadedPaths.push(path);
    const { error: fileError } = await supabase.from("submission_files").insert({ submission_id: submission.id, file_name: item.fileName, storage_path: path, mime_type: item.file.type || "application/octet-stream", file_size: item.file.size });
    if (fileError) {
      await supabase.storage.from(BUCKET).remove(uploadedPaths);
      await supabase.from("submissions").delete().eq("id", submission.id);
      redirect(withMessage(returnPath, "error", "Không thể lưu thông tin file nộp."));
    }
  }
  revalidatePath("/dashboard"); revalidatePath("/submissions"); revalidatePath(returnPath);
  redirect(withMessage(`/submissions/${submission.id}`, "message", "Đã nộp bài thành công. Bài đang chờ review."));
}

export async function submitAssignmentFiles(assignmentId: string, formData: FormData) {
  const id = z.uuid().parse(assignmentId);
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  await saveSubmissionFiles(id, files, `/assignments/${id}`);
}

export async function submitSourceFile(assignmentId: string, problemId: string, problemSlug: string, formData: FormData) {
  const { supabase } = await requireUser();
  const assignment = z.uuid().parse(assignmentId); const problem = z.uuid().parse(problemId); const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(problemSlug);
  const returnPath = `/problems/${slug}`;
  const file = formData.get("sourceFile");
  if (!(file instanceof File) || !file.size) redirect(withMessage(returnPath, "error", "Vui lòng chọn một file code."));
  const { data } = await supabase.from("assignments").select("id").eq("id", assignment).eq("problem_id", problem).eq("status", "published").maybeSingle();
  if (!data) redirect(withMessage(returnPath, "error", "Đề này chưa được gắn với bài giao đang mở."));
  await saveSubmissionFiles(data.id, [file], returnPath, true);
}

export async function reviewSubmission(submissionId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin(); const id = z.uuid().parse(submissionId); const returnPath = `/admin/submissions/${id}`;
  const parsed = z.object({ status: z.enum(["correct", "incorrect"]), score: z.coerce.number().min(0).max(100), reviewNote: z.string().trim().max(5000) }).safeParse({ status: formData.get("status"), score: formData.get("score"), reviewNote: formData.get("reviewNote") });
  if (!parsed.success) redirect(withMessage(returnPath, "error", parsed.error.issues[0]?.message ?? "Kết quả review không hợp lệ."));
  const { error } = await supabase.from("submissions").update({ status: parsed.data.status, score: parsed.data.score, review_note: parsed.data.reviewNote || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(withMessage(returnPath, "error", "Không thể lưu kết quả review."));
  revalidatePath(returnPath); revalidatePath(`/submissions/${id}`); revalidatePath("/admin/submissions"); revalidatePath("/dashboard");
  redirect(withMessage(returnPath, "message", "Đã lưu kết quả review."));
}
