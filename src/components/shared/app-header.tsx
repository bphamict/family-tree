import Link from "next/link";
import { Network } from "lucide-react";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { AppMobileNav } from "@/components/shared/app-nav";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { getProfileByUserId } from "@/features/auth/profile-service";
import { getUser } from "@/lib/auth/get-user";
import { getTranslations } from "@/lib/i18n/translator";

export async function AppHeader() {
  const t = await getTranslations();
  const user = await getUser();
  const profile = user ? await getProfileByUserId(user.id) : null;

  const userMenuProps = user
    ? {
        fullName: profile?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }
    : null;

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
              <LocaleSwitcher />
              <ThemeSwitcher />
              <AppMobileNav />
              {userMenuProps ? (
                <div className="hidden md:flex md:items-center">
                  <UserMenu {...userMenuProps} />
                </div>
              ) : null}
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
