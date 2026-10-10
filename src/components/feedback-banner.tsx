import { AlertCircle, CheckCircle2 } from "lucide-react";

type FeedbackBannerProps = {
  error?: string;
  message?: string;
};

export function FeedbackBanner({ error, message }: FeedbackBannerProps) {
  if (!error && !message) return null;

  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-6 flex gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 shrink-0" size={18} />
      ) : (
        <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
      )}
      <span>{error || message}</span>
    </div>
  );
}
