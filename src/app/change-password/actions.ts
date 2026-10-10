"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

function withError(message: string): never {
  redirect(`/change-password?error=${encodeURIComponent(message)}`);
}

export async function changeInitialPassword(formData: FormData) {
  const parsed = z
    .object({
      password: z
        .string()
        .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.")
        .regex(/[a-z]/, "Mật khẩu cần có chữ thường.")
        .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa.")
        .regex(/[0-9]/, "Mật khẩu cần có chữ số.")
        .regex(/[^A-Za-z0-9]/, "Mật khẩu cần có ký tự đặc biệt."),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Mật khẩu xác nhận không khớp.",
      path: ["confirmPassword"],
    })
    .safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

  if (!parsed.success) withError(parsed.error.issues[0]?.message ?? "Mật khẩu không hợp lệ.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) withError("Không thể đổi mật khẩu. Vui lòng thử lại.");

  const { error: profileError } = await supabase.rpc("complete_password_change");
  if (profileError) withError("Đã đổi mật khẩu nhưng chưa thể cập nhật hồ sơ.");

  redirect("/dashboard");
}
