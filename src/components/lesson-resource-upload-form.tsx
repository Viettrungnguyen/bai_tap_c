"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const allowed = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md", ".zip", ".png", ".jpg", ".jpeg"]);

export function LessonResourceUploadForm({ lessonId, userId, defaultSortOrder }: { lessonId: string; userId: string; defaultSortOrder: number }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); const form = new FormData(event.currentTarget); const file = form.get("resourceFile");
    if (!(file instanceof File) || !file.size) return setError("Vui lòng chọn tài liệu.");
    const fileName = file.name.split(/[\\/]/).pop()!.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 180); const dot = fileName.lastIndexOf("."); const extension = dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
    if (!allowed.has(extension)) return setError("Định dạng tài liệu không được hỗ trợ.");
    if (file.size > 10 * 1024 * 1024) return setError("Tài liệu không được vượt quá 10 MB.");
    const titleValue = form.get("title"); const title = typeof titleValue === "string" && titleValue.trim() ? titleValue.trim() : fileName.replace(/\.[^.]+$/, ""); const sortOrder = Number(form.get("sortOrder") || 0);
    setPending(true); const supabase = createClient(); const path = `${lessonId}/${crypto.randomUUID()}-${fileName}`;
    const { error: uploadError } = await supabase.storage.from("lesson-resources").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) { setPending(false); return setError("Không thể tải file lên Storage."); }
    const { error: insertError } = await supabase.from("lesson_resources").insert({ lesson_id: lessonId, title: title.slice(0, 160), file_name: fileName, storage_path: path, mime_type: file.type || "application/octet-stream", file_size: file.size, sort_order: Number.isInteger(sortOrder) && sortOrder >= 0 ? sortOrder : 0, uploaded_by: userId });
    if (insertError) { await supabase.storage.from("lesson-resources").remove([path]); setPending(false); return setError("Không thể lưu thông tin tài liệu."); }
    event.currentTarget.reset(); setPending(false); router.refresh();
  }
  return <form onSubmit={submit} className="mt-6 grid gap-4 rounded-xl border border-dashed border-slate-300 p-4 md:grid-cols-[1fr_110px]">{error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 md:col-span-2">{error}</p> : null}<label className="block text-sm font-semibold text-slate-700">Tên hiển thị<input name="title" maxLength={160} placeholder="Để trống để dùng tên file" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600" /></label><label className="block text-sm font-semibold text-slate-700">Thứ tự<input name="sortOrder" type="number" min={0} defaultValue={defaultSortOrder} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600" /></label><label className="block text-sm font-semibold text-slate-700 md:col-span-2">Chọn file<input name="resourceFile" type="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.zip,.png,.jpg,.jpeg" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white" /></label><div className="md:col-span-2"><button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 font-semibold text-white disabled:opacity-60"><FileUp size={17} /> {pending ? "Đang tải lên..." : "Tải tài liệu lên"}</button></div></form>;
}
