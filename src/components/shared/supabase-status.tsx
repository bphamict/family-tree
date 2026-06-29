import { Badge } from "@/components/ui/badge";
import { getTranslations } from "@/lib/i18n/translator";
import type { SupabaseHealthStatus } from "@/lib/supabase/health";

type SupabaseStatusProps = {
  health: SupabaseHealthStatus;
};

export async function SupabaseStatus({ health }: SupabaseStatusProps) {
  const t = await getTranslations();

  const variant = health.connected
    ? "default"
    : health.configured
      ? "destructive"
      : "secondary";

  const label = health.connected
    ? t("common.connected")
    : health.configured
      ? t("common.connectionFailed")
      : t("common.notConfigured");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t("common.supabase")}</span>
        <Badge variant={variant}>{label}</Badge>
      </div>
      <p className="text-muted-foreground text-sm">{health.message}</p>
    </div>
  );
}
