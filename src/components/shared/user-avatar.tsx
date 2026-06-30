import Image from "next/image";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
  fullName: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-10 text-sm",
  md: "size-14 text-base",
  lg: "size-24 text-2xl",
};

const imageSizes = {
  sm: 40,
  md: 56,
  lg: 96,
};

function getInitials(fullName: string | null): string {
  if (!fullName?.trim()) {
    return "?";
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function UserAvatar({
  fullName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const displayName = fullName?.trim() || "User";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex items-center justify-center rounded-full font-medium",
        sizeClasses[size],
        className,
      )}
      aria-hidden={!fullName}
    >
      {getInitials(fullName)}
    </div>
  );
}
