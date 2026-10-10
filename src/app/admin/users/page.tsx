import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, UserRound, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getProblemProgress, type ProgressSubmission } from "@/lib/progress";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Tổng kết học viên" };
export const instant = false;

export default async function AdminUsersPage() {
  const { supabase, user } = await requireAdmin();
  const [profilesResult, problemsResult, submissionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, student_code, role, created_at, updated_at")
      .eq("role", "user")
      .order("full_name", { ascending: true, nullsFirst: false }),
    supabase
      .from("problems")
      .select("id")
      .eq("status", "published"),
    supabase
      .from("submissions")
      .select("id, user_id, problem_id, status, score, submitted_at")
      .order("submitted_at", { ascending: false }),
  ]);

  const learners = (profilesResult.data ?? []) as Profile[];
  const problemIds = new Set((problemsResult.data ?? []).map((problem) => problem.id as string));
  const submissions = ((submissionsResult.data ?? []) as ProgressSubmission[]).filter((submission) =>
    problemIds.has(submission.problem_id),
  );
  const totalProblems = problemIds.size;
  const summaries = learners.map((learner) => {
    const learnerSubmissions = submissions.filter((submission) => submission.user_id === learner.id);
    const byProblem = new Map<string, ProgressSubmission[]>();

    for (const submission of learnerSubmissions) {
      const current = byProblem.get(submission.problem_id) ?? [];
      current.push(submission);
      byProblem.set(submission.problem_id, current);
    }

    const progress = [...byProblem.values()].map(getProblemProgress);
    const attempted = progress.length;
    const correct = progress.filter((item) => item.status === "correct").length;

    return {
      learner,
      attempted,
      correct,
      percent: totalProblems ? Math.round((correct / totalProblems) * 100) : 0,
    };
  });

  const activeLearners = summaries.filter((summary) => summary.attempted > 0).length;
  const completedResults = summaries.reduce((total, summary) => total + summary.correct, 0);

  return (
    <AppShell email={user.email} isAdmin>
      <section>
        <p className="text-sm font-semibold text-emerald-700">THEO DÕI LỚP HỌC</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Tổng kết học viên</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Theo dõi số bài đã nộp, số bài làm đúng và mở chi tiết tiến độ của từng học viên.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Tổng học viên", value: learners.length, icon: Users, style: "bg-blue-50 text-blue-700" },
            { label: "Đã bắt đầu làm", value: activeLearners, icon: ClipboardList, style: "bg-amber-50 text-amber-700" },
            { label: "Lượt bài hoàn thành", value: completedResults, icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" },
          ].map(({ label, value, icon: Icon, style }) => (
            <article key={label} className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${style}`}>
                <Icon size={20} />
              </span>
              <div className="mt-5 text-3xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </article>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
          {summaries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Học viên</th>
                    <th className="px-4 py-4 text-center font-semibold">Tổng bài</th>
                    <th className="px-4 py-4 text-center font-semibold">Đã làm</th>
                    <th className="px-4 py-4 text-center font-semibold">Đúng</th>
                    <th className="px-4 py-4 font-semibold">Hoàn thành</th>
                    <th className="px-5 py-4 text-right font-semibold">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map(({ learner, attempted, correct, percent }) => (
                    <tr key={learner.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                            <UserRound size={18} />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{learner.full_name || learner.email}</div>
                            <div className="mt-0.5 truncate text-xs text-slate-500">
                              {learner.student_code ? `${learner.student_code} · ` : ""}{learner.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">{totalProblems}</td>
                      <td className="px-4 py-4 text-center font-semibold text-amber-700">{attempted}</td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-700">{correct}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-36 items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-10 text-right text-sm font-semibold">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/users/${learner.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                        >
                          Xem <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <Users size={23} />
              </span>
              <h2 className="mt-5 text-xl font-semibold">Chưa có học viên</h2>
              <p className="mt-2 text-slate-500">Tài khoản có role user sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
