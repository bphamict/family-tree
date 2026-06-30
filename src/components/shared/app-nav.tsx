"use client";

import Link from "next/link";
import { LayoutDashboard, Menu, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { useTranslations } from "@/lib/i18n/use-translator";

export function AppDesktopNav() {
  const t = useTranslations();

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">{t("common.dashboard")}</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/families">{t("common.families")}</Link>
      </Button>
    </div>
  );
}

export function AppMobileNav() {
  const t = useTranslations();

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
              <Link href="/dashboard">
                <LayoutDashboard />
                {t("common.dashboard")}
              </Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/families">
                <UsersRound />
                {t("common.families")}
              </Link>
            </Button>
          </SheetClose>
          <SignOutButton showLabel className="w-full justify-start" />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
