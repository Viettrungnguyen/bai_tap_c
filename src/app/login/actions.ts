"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập hoặc email."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên."),
});

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithError(message: string, mode = "login"): never {
  const params = new URLSearchParams({ error: message });
  if (mode === "signup") params.set("mode", "signup");
  redirect(`/login?${params.toString()}`);
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    identifier: formValue(formData, "identifier"),
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
  }

  const supabase = await createClient();
  const identifier = parsed.data.identifier.toLowerCase();
  const email = identifier.includes("@")
    ? z.email().safeParse(identifier).data
    : /^[a-z0-9]+$/.test(identifier)
      ? `${identifier}@students.example.com`
      : undefined;

  if (!email) redirectWithError("Tên đăng nhập hoặc email không hợp lệ.");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    redirectWithError("Tên đăng nhập, email hoặc mật khẩu không đúng.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.must_change_password) redirect("/change-password");
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formValue(formData, "fullName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
      "signup",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    redirectWithError(error.message, "signup");
  }

  redirect(
    "/login?message=" +
      encodeURIComponent("Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận."),
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
