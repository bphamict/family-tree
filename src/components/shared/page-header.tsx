import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ children, actions, className }: PageHeaderProps) {
  return (
    <section
      className={cn("flex items-start justify-between gap-4", className)}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </section>
  );
}
