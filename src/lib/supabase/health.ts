import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SupabaseHealthStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
};

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!hasPublicEnv()) {
    return {
      configured: false,
      connected: false,
      message: "Supabase environment variables are not configured.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      message: "Connected to Supabase.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error.";

    return {
      configured: true,
      connected: false,
      message,
    };
  }
}
