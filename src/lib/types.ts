export type ProblemStatus = "draft" | "published" | "archived";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type UserRole = "admin" | "user";
export type LessonStatus = "draft" | "published";
export type CourseStatus = "draft" | "published" | "archived";
export type ClassStatus = "active" | "archived";
export type CourseMemberRole = "student" | "instructor";
export type AssignmentType = "coding" | "file" | "text";
export type AssignmentStatus = "draft" | "published" | "archived";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  student_code: string | null;
  school: string | null;
  major: string | null;
  must_change_password: boolean;
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
  assignment_id: string;
  problem_id: string | null;
  language: SubmissionLanguage | null;
  file_name: string | null;
  source_code: string | null;
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

export type SubmissionWithAssignment = Submission & {
  assignments: Pick<Assignment, "id" | "title" | "slug" | "assignment_type"> | null;
  problems?: Pick<Problem, "title" | "slug"> | null;
};

export type CourseWeek = {
  id: string;
  course_id: string;
  week_number: number;
  title: string;
  description: string;
  status: LessonStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  status: CourseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CourseClass = {
  id: string;
  course_id: string;
  name: string;
  code: string;
  description: string;
  starts_on: string | null;
  ends_on: string | null;
  status: ClassStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CourseMember = {
  id: string;
  class_id: string;
  user_id: string;
  role: CourseMemberRole;
  joined_at: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  class_id: string | null;
  week_id: string | null;
  problem_id: string | null;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  assignment_type: AssignmentType;
  status: AssignmentStatus;
  due_at: string | null;
  allowed_extensions: string[];
  max_files: number;
  max_file_size: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SubmissionFile = {
  id: string;
  submission_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
};

export type Lesson = {
  id: string;
  week_id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  sort_order: number;
  status: LessonStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type LessonResource = {
  id: string;
  lesson_id: string;
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  uploaded_by: string;
  created_at: string;
};
