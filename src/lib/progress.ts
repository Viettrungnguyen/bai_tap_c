import type { Submission, SubmissionStatus } from "@/lib/types";

export type ProblemProgressStatus = "not_started" | SubmissionStatus;

export type ProgressSubmission = Pick<
  Submission,
  "id" | "user_id" | "problem_id" | "status" | "score" | "submitted_at"
>;

export type ProblemProgress = {
  status: ProblemProgressStatus;
  attempts: number;
  submission: ProgressSubmission | null;
  lastSubmittedAt: string | null;
};

export function getProblemProgress(submissions: ProgressSubmission[]): ProblemProgress {
  if (!submissions.length) {
    return {
      status: "not_started",
      attempts: 0,
      submission: null,
      lastSubmittedAt: null,
    };
  }

  const sorted = [...submissions].sort(
    (first, second) =>
      new Date(second.submitted_at).getTime() - new Date(first.submitted_at).getTime(),
  );
  const correctSubmission = sorted.find((submission) => submission.status === "correct");
  const representative = correctSubmission ?? sorted[0];

  return {
    status: representative.status,
    attempts: sorted.length,
    submission: representative,
    lastSubmittedAt: sorted[0].submitted_at,
  };
}
