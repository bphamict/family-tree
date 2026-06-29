import type { User } from "@supabase/supabase-js";

import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!hasPublicEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
