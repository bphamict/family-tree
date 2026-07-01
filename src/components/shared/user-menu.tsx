"use client";

import Link from "next/link";
import { ChevronDown, LogOut, User, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/auth-service";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translator";

export type UserMenuUser = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type UserMenuProps = UserMenuUser & {
  className?: string;
};

function getDisplayName({ fullName, email }: UserMenuUser): string {
  return fullName?.trim() || email || "User";
}

export function UserMenu({
  fullName,
  email,
  avatarUrl,
  className,
}: UserMenuProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const displayName = getDisplayName({ fullName, email, avatarUrl });

  async function handleSignOut() {
    setIsSigningOut(true);

    const { error } = await signOut();

    if (error) {
      toast.error(error.message);
      setIsSigningOut(false);
      return;
    }

    toast.success(t("auth.signedOut"));
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 shrink-0 gap-2 px-2 hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:border-transparent data-[state=open]:ring-0 md:max-w-[200px] dark:hover:bg-transparent",
            className,
          )}
          aria-label={t("common.accountMenu")}
        >
          <UserAvatar
            fullName={fullName}
            avatarUrl={avatarUrl}
            size="sm"
            className="size-7 text-xs"
          />
          <span className="hidden truncate md:inline">{displayName}</span>
          <ChevronDown
            className="hidden size-4 shrink-0 opacity-60 md:block"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{displayName}</span>
            {email ? (
              <span className="text-muted-foreground truncate text-xs font-normal">
                {email}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/families">
            <UsersRound aria-hidden />
            {t("common.families")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User aria-hidden />
            {t("profile.title")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut aria-hidden />
          {isSigningOut ? t("common.signingOut") : t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
