import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pageContainerVariants = cva(
  "mx-auto flex w-full flex-1 flex-col gap-8 px-6 py-12",
  {
    variants: {
      size: {
        default: "max-w-5xl",
        narrow: "max-w-3xl",
        wide: "max-w-6xl",
        tree: "max-w-[1800px] min-h-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type PageContainerProps = {
  children: ReactNode;
  className?: string;
} & VariantProps<typeof pageContainerVariants>;

export function PageContainer({
  children,
  size,
  className,
}: PageContainerProps) {
  return (
    <main className={cn(pageContainerVariants({ size }), className)}>
      {children}
    </main>
  );
}
