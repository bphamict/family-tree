import { hasPublicEnv } from "@/lib/env";
import { getTranslations } from "@/lib/i18n/translator";
import { createClient } from "@/lib/supabase/server";

export type SupabaseHealthStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
};

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const t = await getTranslations();

  if (!hasPublicEnv()) {
    return {
      configured: false,
      connected: false,
      message: t("common.supabaseNotConfigured"),
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
      message: t("common.supabaseConnected"),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : t("common.unknownConnectionError");

    return {
      configured: true,
      connected: false,
      message,
    };
  }
}
