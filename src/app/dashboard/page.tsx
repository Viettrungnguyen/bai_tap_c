import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleDashed, Gauge, MemoryStick } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { Problem, ProblemDifficulty } from "@/lib/types";

export const metadata = { title: "Bài tập" };
export const instant = false;

const difficultyLabel: Record<ProblemDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const difficultyStyle: Record<ProblemDifficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser();
  const [problemsResult, submissionsResult] = await Promise.all([
    supabase
      .from("problems")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("submissions").select("problem_id, status").eq("user_id", user.id),
  ]);
  const problems = (problemsResult.data ?? []) as Problem[];
  const submissionRows = (submissionsResult.data ?? []) as Array<{
    problem_id: string;
    status: "pending" | "correct" | "incorrect";
  }>;
  const completedProblemIds = new Set(
    submissionRows.filter((item) => item.status === "correct").map((item) => item.problem_id),
  );
  const attemptedProblemIds = new Set(submissionRows.map((item) => item.problem_id));
  const inProgressCount = [...attemptedProblemIds].filter(
    (problemId) => !completedProblemIds.has(problemId),
  ).length;
  const displayName = profile?.full_name || user.email?.split("@")[0] || "bạn";
  const isAdmin = profile?.role === "admin";

  const stats = [
    { icon: BookOpen, label: "Tổng số bài", value: problems.length, color: "bg-blue-50 text-blue-700" },
    {
      icon: CheckCircle2,
      label: "Đã hoàn thành",
      value: completedProblemIds.size,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: CircleDashed,
      label: "Đang thực hiện",
      value: inProgressCount,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <AppShell email={user.email} isAdmin={isAdmin}>
      <section>
        <p className="text-sm font-semibold text-emerald-700">TỔNG QUAN HỌC TẬP</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
          Chào {displayName}, sẵn sàng code chứ?
        </h1>
        <p className="mt-3 text-slate-600">
          Chọn một bài tập, đọc kỹ yêu cầu và bắt đầu xây dựng lời giải.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <article key={label} className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
                <Icon size={20} />
              </span>
              <div className="mt-5 text-3xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </article>
          ))}
        </div>

        <div className="mt-9 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Bài tập mới</h2>
            <p className="mt-1 text-sm text-slate-500">{problems.length} bài đang được mở</p>
          </div>
        </div>

        {problems.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.slug}`}
                className="group rounded-2xl border border-slate-900/10 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-slate-900/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${difficultyStyle[problem.difficulty]}`}
                    >
                      {difficultyLabel[problem.difficulty]}
                    </span>
                    {completedProblemIds.has(problem.id) ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        Đã đúng
                      </span>
                    ) : attemptedProblemIds.has(problem.id) ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                        Đã nộp
                      </span>
                    ) : null}
                  </div>
                  <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{problem.title}</h3>
                <p className="mt-2 line-clamp-2 min-h-12 leading-6 text-slate-500">
                  {problem.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Gauge size={15} /> {problem.time_limit_ms} ms
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MemoryStick size={15} /> {Math.round(problem.memory_limit_kb / 1024)} MB
                  </span>
                  <span>{problem.allowed_languages.map((item) => (item === "c11" ? "C11" : "C++17")).join(" · ")}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <BookOpen size={23} />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Chưa có bài tập được xuất bản</h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
              Bài tập mới sẽ xuất hiện tại đây sau khi quản trị viên xuất bản.
            </p>
            {isAdmin ? (
              <Link
                href="/admin/problems"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Quản lý bài tập <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </AppShell>
  );
}
