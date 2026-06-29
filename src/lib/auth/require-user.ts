import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";

export async function requireUser(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
