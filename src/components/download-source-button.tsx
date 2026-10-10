"use client";

import { Download } from "lucide-react";

export function DownloadSourceButton({
  sourceCode,
  fileName,
}: {
  sourceCode: string;
  fileName: string;
}) {
  function download() {
    const blob = new Blob([sourceCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
    >
      <Download size={16} /> Tải file
    </button>
  );
}
