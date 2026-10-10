export type ProblemStatus = "draft" | "published" | "archived";
export type ProblemDifficulty = "easy" | "medium" | "hard";

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
