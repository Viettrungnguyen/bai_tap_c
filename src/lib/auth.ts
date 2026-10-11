import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function requireUser(options: { allowPasswordChange?: boolean } = {}) {
  // Authentication and Supabase token validation depend on the incoming
  // request and current time. Opt out of prerendering before either is read.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, role, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.must_change_password && !options.allowPasswordChange) {
    redirect("/change-password");
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const context = await requireUser();

  if (context.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return context;
}
