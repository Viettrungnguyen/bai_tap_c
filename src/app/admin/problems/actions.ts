"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { createSlug } from "@/lib/slug";
import type { ProblemStatus } from "@/lib/types";

const problemSchema = z.object({
  courseId: z.uuid("Khóa học không hợp lệ."),
  title: z.string().trim().min(3, "Tên bài phải có ít nhất 3 ký tự.").max(160),
  description: z.string().trim().min(10, "Nội dung đề phải có ít nhất 10 ký tự."),
  inputDescription: z.string().trim(),
  outputDescription: z.string().trim(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimitMs: z.coerce.number().int().min(100).max(30000),
  memoryLimitKb: z.coerce.number().int().min(16384).max(1048576),
  allowedLanguages: z
    .array(z.enum(["c11", "cpp17"]))
    .min(1, "Chọn ít nhất một ngôn ngữ."),
});

const exampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().trim(),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

const hintSchema = z.object({
  content: z.string().trim().min(1, "Gợi ý không được để trống."),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  score: z.coerce.number().min(0).max(10000),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isSample: z.boolean(),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function problemInput(formData: FormData) {
  return {
    courseId: value(formData, "courseId"),
    title: value(formData, "title"),
    description: value(formData, "description"),
    inputDescription: value(formData, "inputDescription"),
    outputDescription: value(formData, "outputDescription"),
    difficulty: value(formData, "difficulty"),
    timeLimitMs: value(formData, "timeLimitMs"),
    memoryLimitKb: value(formData, "memoryLimitKb"),
    allowedLanguages: formData
      .getAll("allowedLanguages")
      .filter((item): item is string => typeof item === "string"),
  };
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

function withMessage(path: string, key: "error" | "message", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(message)}`;
}

function databaseMessage(message: string) {
  if (message.includes("Problem is used by an assignment")) {
    return "Không thể chuyển đề sang khóa khác vì đề đang được dùng trong bài giao hiện tại.";
  }
  return "Không thể lưu dữ liệu. Vui lòng thử lại.";
}

export async function createProblem(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = problemSchema.safeParse(problemInput(formData));

  if (!parsed.success) {
    redirect(withMessage("/admin/problems/new", "error", firstIssue(parsed.error)));
  }

  const { data, error } = await supabase
    .from("problems")
    .insert({
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      slug: createSlug(parsed.data.title),
      description: parsed.data.description,
      input_description: parsed.data.inputDescription,
      output_description: parsed.data.outputDescription,
      difficulty: parsed.data.difficulty,
      time_limit_ms: parsed.data.timeLimitMs,
      memory_limit_kb: parsed.data.memoryLimitKb,
      allowed_languages: parsed.data.allowedLanguages,
      created_by: user.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      withMessage(
        "/admin/problems/new",
        "error",
        databaseMessage(error?.message ?? ""),
      ),
    );
  }

  revalidatePath("/admin/problems");
  redirect(
    withMessage(
      `/admin/problems/${data.id}/edit`,
      "message",
      "Đã tạo bản nháp. Bạn có thể thêm ví dụ, gợi ý và test case.",
    ),
  );
}

export async function updateProblem(problemId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const parsed = problemSchema.safeParse(problemInput(formData));
  const returnPath = `/admin/problems/${id}/edit`;

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase
    .from("problems")
    .update({
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      input_description: parsed.data.inputDescription,
      output_description: parsed.data.outputDescription,
      difficulty: parsed.data.difficulty,
      time_limit_ms: parsed.data.timeLimitMs,
      memory_limit_kb: parsed.data.memoryLimitKb,
      allowed_languages: parsed.data.allowedLanguages,
    })
    .eq("id", id);

  if (error) {
    redirect(withMessage(returnPath, "error", databaseMessage(error.message)));
  }

  revalidatePath(returnPath);
  revalidatePath("/admin/problems");
  revalidatePath("/dashboard");
  redirect(withMessage(returnPath, "message", "Đã lưu nội dung bài tập."));
}

export async function setProblemStatus(problemId: string, status: ProblemStatus) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const nextStatus = z.enum(["draft", "published", "archived"]).parse(status);
  const returnPath = `/admin/problems/${id}/edit`;

  if (nextStatus === "published") {
    const { count, error: countError } = await supabase
      .from("test_cases")
      .select("id", { count: "exact", head: true })
      .eq("problem_id", id);

    if (countError || !count) {
      redirect(
        withMessage(
          returnPath,
          "error",
          "Cần ít nhất một test case trước khi xuất bản bài.",
        ),
      );
    }
  }

  const { error } = await supabase
    .from("problems")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) {
    redirect(withMessage(returnPath, "error", "Không thể đổi trạng thái bài."));
  }

  revalidatePath(returnPath);
  revalidatePath("/admin/problems");
  revalidatePath("/dashboard");
  redirect(withMessage(returnPath, "message", "Đã cập nhật trạng thái bài."));
}

export async function deleteProblem(problemId: string) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const { error } = await supabase.from("problems").delete().eq("id", id);

  if (error) {
    redirect(withMessage("/admin/problems", "error", "Không thể xóa bài tập."));
  }

  revalidatePath("/admin/problems");
  revalidatePath("/dashboard");
  redirect(withMessage("/admin/problems", "message", "Đã xóa bài tập."));
}

export async function addExample(problemId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = exampleSchema.safeParse({
    input: value(formData, "input"),
    output: value(formData, "output"),
    explanation: value(formData, "explanation"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase.from("problem_examples").insert({
    problem_id: id,
    input: parsed.data.input,
    output: parsed.data.output,
    explanation: parsed.data.explanation,
    sort_order: parsed.data.sortOrder,
  });

  if (error) redirect(withMessage(returnPath, "error", "Không thể thêm ví dụ."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã thêm ví dụ."));
}

export async function deleteExample(problemId: string, exampleId: string) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(exampleId);
  const returnPath = `/admin/problems/${id}/edit`;
  const { error } = await supabase
    .from("problem_examples")
    .delete()
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể xóa ví dụ."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã xóa ví dụ."));
}

export async function updateExample(
  problemId: string,
  exampleId: string,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(exampleId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = exampleSchema.safeParse({
    input: value(formData, "input"),
    output: value(formData, "output"),
    explanation: value(formData, "explanation"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase
    .from("problem_examples")
    .update({
      input: parsed.data.input,
      output: parsed.data.output,
      explanation: parsed.data.explanation,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể sửa ví dụ."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã cập nhật ví dụ."));
}

export async function addHint(problemId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = hintSchema.safeParse({
    content: value(formData, "content"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase.from("problem_hints").insert({
    problem_id: id,
    content: parsed.data.content,
    sort_order: parsed.data.sortOrder,
  });

  if (error) redirect(withMessage(returnPath, "error", "Không thể thêm gợi ý."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã thêm gợi ý."));
}

export async function deleteHint(problemId: string, hintId: string) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(hintId);
  const returnPath = `/admin/problems/${id}/edit`;
  const { error } = await supabase
    .from("problem_hints")
    .delete()
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể xóa gợi ý."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã xóa gợi ý."));
}

export async function updateHint(problemId: string, hintId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(hintId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = hintSchema.safeParse({
    content: value(formData, "content"),
    sortOrder: value(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase
    .from("problem_hints")
    .update({ content: parsed.data.content, sort_order: parsed.data.sortOrder })
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể sửa gợi ý."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã cập nhật gợi ý."));
}

export async function addTestCase(problemId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = testCaseSchema.safeParse({
    input: value(formData, "input"),
    expectedOutput: value(formData, "expectedOutput"),
    score: value(formData, "score") || "0",
    sortOrder: value(formData, "sortOrder") || "0",
    isSample: formData.get("isSample") === "on",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase.from("test_cases").insert({
    problem_id: id,
    input: parsed.data.input,
    expected_output: parsed.data.expectedOutput,
    score: parsed.data.score,
    sort_order: parsed.data.sortOrder,
    is_sample: parsed.data.isSample,
  });

  if (error) redirect(withMessage(returnPath, "error", "Không thể thêm test case."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã thêm test case."));
}

export async function deleteTestCase(problemId: string, testCaseId: string) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(testCaseId);
  const returnPath = `/admin/problems/${id}/edit`;
  const { error } = await supabase
    .from("test_cases")
    .delete()
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể xóa test case."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã xóa test case."));
}

export async function updateTestCase(
  problemId: string,
  testCaseId: string,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(problemId);
  const itemId = z.uuid().parse(testCaseId);
  const returnPath = `/admin/problems/${id}/edit`;
  const parsed = testCaseSchema.safeParse({
    input: value(formData, "input"),
    expectedOutput: value(formData, "expectedOutput"),
    score: value(formData, "score") || "0",
    sortOrder: value(formData, "sortOrder") || "0",
    isSample: formData.get("isSample") === "on",
  });

  if (!parsed.success) {
    redirect(withMessage(returnPath, "error", firstIssue(parsed.error)));
  }

  const { error } = await supabase
    .from("test_cases")
    .update({
      input: parsed.data.input,
      expected_output: parsed.data.expectedOutput,
      score: parsed.data.score,
      sort_order: parsed.data.sortOrder,
      is_sample: parsed.data.isSample,
    })
    .eq("id", itemId)
    .eq("problem_id", id);

  if (error) redirect(withMessage(returnPath, "error", "Không thể sửa test case."));
  revalidatePath(returnPath);
  redirect(withMessage(returnPath, "message", "Đã cập nhật test case."));
}
