import Link from "next/link";
import { Network } from "lucide-react";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getUser } from "@/lib/auth/get-user";
import { getTranslations } from "@/lib/i18n/translator";

export async function AppHeader() {
  const t = await getTranslations();
  const user = await getUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Network className="size-5" aria-hidden="true" />
          <span className="font-semibold">{t("common.appName")}</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{t("common.dashboard")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/families">{t("common.families")}</Link>
              </Button>
              <LocaleSwitcher />
              <ThemeSwitcher />
              <SignOutButton />
            </>
          ) : (
            <>
              <LocaleSwitcher />
              <ThemeSwitcher />
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("common.signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("common.createAccount")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
