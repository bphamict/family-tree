"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/auth-service";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translator";

type SignOutButtonProps = {
  className?: string;
  showLabel?: boolean;
};

export function SignOutButton({
  className,
  showLabel = false,
}: SignOutButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    <Button
      variant="ghost"
      size={showLabel ? "default" : "sm"}
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label={isSigningOut ? t("common.signingOut") : t("common.signOut")}
      className={cn(showLabel && "justify-start", className)}
    >
      <LogOut className="size-4" aria-hidden />
      {showLabel &&
        (isSigningOut ? t("common.signingOut") : t("common.signOut"))}
    </Button>
  );
}
