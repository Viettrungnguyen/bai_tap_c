"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUp } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Props = {
  assignmentId: string;
  problemId: string | null;
  userId: string;
  allowedExtensions: string[];
  maxFiles: number;
  maxFileSize: number;
};

function cleanFileName(name: string) {
  return name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
}

function storageFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export function AssignmentUploadForm({ assignmentId, problemId, userId, allowedExtensions, maxFiles, maxFileSize }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const input = event.currentTarget.elements.namedItem("files") as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return setError("Vui lòng chọn file cần nộp.");
    if (files.length > maxFiles) return setError(`Chỉ được nộp tối đa ${maxFiles} file.`);
    for (const file of files) {
      const name = cleanFileName(file.name); const dot = name.lastIndexOf("."); const extension = dot >= 0 ? name.slice(dot).toLowerCase() : "";
      if (file.size > maxFileSize) return setError(`Mỗi file không được vượt quá ${Math.round(maxFileSize / 1024 / 1024)} MB.`);
      if (allowedExtensions.length && !allowedExtensions.includes(extension)) return setError(`Định dạng ${extension || "không có đuôi"} không được phép.`);
    }

    setPending(true);
    const supabase = createClient();
    const { data: submission, error: createError } = await supabase.from("submissions").insert({ user_id: userId, assignment_id: assignmentId, problem_id: problemId, language: null, file_name: null, source_code: null, status: "pending" }).select("id").single();
    if (createError || !submission) { setPending(false); return setError("Không thể tạo bài nộp."); }

    const uploaded: string[] = [];
    for (const file of files) {
      const fileName = cleanFileName(file.name); const path = `${userId}/${submission.id}/${crypto.randomUUID()}-${storageFileName(fileName)}`;
      const { error: uploadError } = await supabase.storage.from("assignment-submissions").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) { if (uploaded.length) await supabase.storage.from("assignment-submissions").remove(uploaded); await supabase.from("submissions").delete().eq("id", submission.id); setPending(false); return setError("Không thể tải file lên kho lưu trữ."); }
      uploaded.push(path);
      const { error: metadataError } = await supabase.from("submission_files").insert({ submission_id: submission.id, file_name: fileName, storage_path: path, mime_type: file.type || "application/octet-stream", file_size: file.size });
      if (metadataError) { await supabase.storage.from("assignment-submissions").remove(uploaded); await supabase.from("submissions").delete().eq("id", submission.id); setPending(false); return setError("Không thể lưu thông tin file nộp."); }
    }
    router.push(`/submissions/${submission.id}?message=${encodeURIComponent("Đã nộp bài thành công. Bài đang chờ review.")}`);
    router.refresh();
  }

  const accept = allowedExtensions.length ? allowedExtensions.join(",") : undefined;
  return <form onSubmit={submit} className="mt-5 space-y-4">{error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}<label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 hover:border-emerald-500"><FileUp className="mb-2 text-emerald-700" /><span>Chọn file từ máy</span><input name="files" type="file" multiple={maxFiles > 1} accept={accept} required className="mt-3 block w-full text-xs" /></label><button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-emerald-700 font-semibold text-white disabled:opacity-60">{pending ? "Đang tải file..." : "Nộp bài"}</button></form>;
}
