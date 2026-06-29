import {
  CircleHelp,
  Mars,
  UserRound,
  Venus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { PersonGender } from "@/types/person";

const genderConfig: Record<
  PersonGender,
  { Icon: LucideIcon; colorClass: string }
> = {
  male: { Icon: Mars, colorClass: "text-blue-600 dark:text-blue-400" },
  female: { Icon: Venus, colorClass: "text-pink-600 dark:text-pink-400" },
  other: { Icon: UserRound, colorClass: "text-muted-foreground" },
  unknown: { Icon: CircleHelp, colorClass: "text-muted-foreground" },
};

type GenderIconProps = {
  gender: PersonGender | null | undefined;
  label?: string;
  className?: string;
  iconClassName?: string;
};

export function GenderIcon({
  gender,
  label,
  className,
  iconClassName,
}: GenderIconProps) {
  if (!gender) {
    return null;
  }

  const { Icon, colorClass } = genderConfig[gender];

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      aria-label={label}
      title={label}
    >
      <Icon className={cn("size-3.5", colorClass, iconClassName)} aria-hidden />
    </span>
  );
}
