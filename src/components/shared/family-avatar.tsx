import { cn } from "@/lib/utils";

type FamilyAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-10 text-sm",
  md: "size-14 text-base",
  lg: "size-24 text-2xl",
};

function getFamilyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function FamilyAvatar({
  name,
  size = "md",
  className,
}: FamilyAvatarProps) {
  const displayName = name.trim() || "Family";

  return (
    <div
      className={cn(
        "bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-full font-medium",
        sizeClasses[size],
        className,
      )}
      aria-hidden
      title={displayName}
    >
      {getFamilyInitials(displayName)}
    </div>
  );
}
