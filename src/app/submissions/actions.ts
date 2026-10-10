"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin, requireUser } from "@/lib/auth";

const MAX_SOURCE_SIZE = 256 * 1024;
const languageByExtension = {
  ".c": "c11",
  ".cc": "cpp17",
  ".cpp": "cpp17",
  ".cxx": "cpp17",
} as const;

function withMessage(path: string, key: "error" | "message", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

function safeFileName(value: string) {
  return value
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255);
}

export async function submitSourceFile(problemId: string, problemSlug: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = z.uuid().parse(problemId);
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(problemSlug);
  const returnPath = `/problems/${slug}`;
  const uploadedFile = formData.get("sourceFile");

  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    redirect(withMessage(returnPath, "error", "Vui lòng chọn một file code."));
  }

  if (uploadedFile.size > MAX_SOURCE_SIZE) {
    redirect(withMessage(returnPath, "error", "File code không được vượt quá 256 KB."));
  }

  const fileName = safeFileName(uploadedFile.name);
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const language = languageByExtension[extension as keyof typeof languageByExtension];

  if (!fileName || !language) {
    redirect(
      withMessage(returnPath, "error", "Chỉ chấp nhận file .c, .cc, .cpp hoặc .cxx."),
    );
  }

  const { data: problem } = await supabase
    .from("problems")
    .select("id, allowed_languages, status")
    .eq("id", id)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!problem) {
    redirect(withMessage(returnPath, "error", "Bài tập không còn nhận bài nộp."));
  }

  if (!(problem.allowed_languages as string[]).includes(language)) {
    redirect(withMessage(returnPath, "error", "Ngôn ngữ của file không được phép cho bài này."));
  }

  let sourceCode: string;
  try {
    sourceCode = new TextDecoder("utf-8", { fatal: true }).decode(
      await uploadedFile.arrayBuffer(),
    );
  } catch {
    redirect(withMessage(returnPath, "error", "File phải là văn bản UTF-8 hợp lệ."));
  }

  if (!sourceCode.trim() || sourceCode.includes("\u0000")) {
    redirect(withMessage(returnPath, "error", "File code trống hoặc không hợp lệ."));
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      problem_id: id,
      language,
      file_name: fileName,
      source_code: sourceCode,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !submission) {
    redirect(withMessage(returnPath, "error", "Không thể lưu bài nộp. Vui lòng thử lại."));
  }

  revalidatePath("/dashboard");
  revalidatePath("/submissions");
  revalidatePath(returnPath);
  redirect(
    withMessage(
      `/submissions/${submission.id}`,
      "message",
      "Đã nộp file thành công. Bài đang chờ admin review.",
    ),
  );
}

export async function reviewSubmission(submissionId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = z.uuid().parse(submissionId);
  const parsed = z
    .object({
      status: z.enum(["correct", "incorrect"]),
      score: z.coerce.number().min(0).max(100),
      reviewNote: z.string().trim().max(5000),
    })
    .safeParse({
      status: formData.get("status"),
      score: formData.get("score"),
      reviewNote: formData.get("reviewNote"),
    });
  const returnPath = `/admin/submissions/${id}`;

  if (!parsed.success) {
    redirect(
      withMessage(
        returnPath,
        "error",
        parsed.error.issues[0]?.message ?? "Kết quả review không hợp lệ.",
      ),
    );
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      status: parsed.data.status,
      score: parsed.data.score,
      review_note: parsed.data.reviewNote || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(withMessage(returnPath, "error", "Không thể lưu kết quả review."));
  }

  revalidatePath(returnPath);
  revalidatePath(`/submissions/${id}`);
  revalidatePath("/admin/submissions");
  revalidatePath("/dashboard");
  redirect(withMessage(returnPath, "message", "Đã lưu kết quả review."));
}
