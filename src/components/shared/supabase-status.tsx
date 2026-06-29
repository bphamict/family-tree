import { Badge } from "@/components/ui/badge";
import type { SupabaseHealthStatus } from "@/lib/supabase/health";

type SupabaseStatusProps = {
  health: SupabaseHealthStatus;
};

export function SupabaseStatus({ health }: SupabaseStatusProps) {
  const variant = health.connected
    ? "default"
    : health.configured
      ? "destructive"
      : "secondary";

  const label = health.connected
    ? "Connected"
    : health.configured
      ? "Connection failed"
      : "Not configured";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Supabase</span>
        <Badge variant={variant}>{label}</Badge>
      </div>
      <p className="text-muted-foreground text-sm">{health.message}</p>
    </div>
  );
}
