import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LandingFeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function LandingFeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: LandingFeatureCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/80 h-full border-transparent shadow-sm",
        className,
      )}
    >
      <CardHeader className="gap-4">
        <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
