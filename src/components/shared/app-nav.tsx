"use client";

import Link from "next/link";
import { LogOut, Menu, User, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/features/auth/auth-service";
import { useTranslations } from "@/lib/i18n/use-translator";

export function AppMobileNav() {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("common.menu")}
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>{t("common.menu")}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          <SheetClose asChild>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/families">
                <UsersRound className="size-4" aria-hidden />
                {t("common.families")}
              </Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/profile">
                <User className="size-4" aria-hidden />
                {t("profile.title")}
              </Link>
            </Button>
          </SheetClose>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive justify-start"
            disabled={isSigningOut}
            onClick={() => {
              void handleSignOut();
            }}
          >
            <LogOut className="size-4" aria-hidden />
            {isSigningOut ? t("common.signingOut") : t("common.signOut")}
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
