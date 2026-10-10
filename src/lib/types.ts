export type ProblemStatus = "draft" | "published" | "archived";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type UserRole = "admin" | "user";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  student_code: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  input_description: string;
  output_description: string;
  difficulty: ProblemDifficulty;
  time_limit_ms: number;
  memory_limit_kb: number;
  allowed_languages: string[];
  status: ProblemStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ProblemExample = {
  id: string;
  problem_id: string;
  input: string;
  output: string;
  explanation: string;
  sort_order: number;
};

export type ProblemHint = {
  id: string;
  problem_id: string;
  content: string;
  sort_order: number;
};

export type TestCase = {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
  score: number;
  sort_order: number;
};

export type SubmissionStatus = "pending" | "correct" | "incorrect";
export type SubmissionLanguage = "c11" | "cpp17";

export type Submission = {
  id: string;
  user_id: string;
  problem_id: string;
  language: SubmissionLanguage;
  file_name: string;
  source_code: string;
  status: SubmissionStatus;
  score: number | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export type SubmissionWithProblem = Submission & {
  problems: Pick<Problem, "title" | "slug"> | null;
};
