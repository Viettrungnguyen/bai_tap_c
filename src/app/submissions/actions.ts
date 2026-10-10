"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";

function withMessage(path: string, key: "error" | "message", message: string) { return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`; }

export async function reviewSubmission(submissionId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin(); const id = z.uuid().parse(submissionId); const returnPath = `/admin/submissions/${id}`;
  const parsed = z.object({ status: z.enum(["correct", "incorrect"]), score: z.coerce.number().min(0).max(100), reviewNote: z.string().trim().max(5000) }).safeParse({ status: formData.get("status"), score: formData.get("score"), reviewNote: formData.get("reviewNote") });
  if (!parsed.success) redirect(withMessage(returnPath, "error", parsed.error.issues[0]?.message ?? "Kết quả review không hợp lệ."));
  const { error } = await supabase.from("submissions").update({ status: parsed.data.status, score: parsed.data.score, review_note: parsed.data.reviewNote || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(withMessage(returnPath, "error", "Không thể lưu kết quả review."));
  revalidatePath(returnPath); revalidatePath(`/submissions/${id}`); revalidatePath("/admin/submissions"); revalidatePath("/dashboard");
  redirect(withMessage(returnPath, "message", "Đã lưu kết quả review."));
}
