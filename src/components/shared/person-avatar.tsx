import Image from "next/image";

import { cn } from "@/lib/utils";
import { formatPersonName, type Person } from "@/types/person";

type PersonAvatarProps = {
  person: Pick<Person, "first_name" | "middle_name" | "last_name" | "avatar_url">;
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

export function PersonAvatar({
  person,
  size = "md",
  className,
}: PersonAvatarProps) {
  const initials = `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();
  const name = formatPersonName(person);

  if (person.avatar_url) {
    return (
      <Image
        src={person.avatar_url}
        alt={name}
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
      aria-hidden={!name}
    >
      {initials}
    </div>
  );
}
