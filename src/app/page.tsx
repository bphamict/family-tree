import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupabaseStatus } from "@/components/shared/supabase-status";
import { getUser } from "@/lib/auth/get-user";
import { getTranslations } from "@/lib/i18n/translator";
import { checkSupabaseHealth } from "@/lib/supabase/health";

export default async function Home() {
  const t = await getTranslations();
  const [supabaseHealth, user] = await Promise.all([
    checkSupabaseHealth(),
    getUser(),
  ]);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            {t("home.subtitle")}
          </p>
          {user ? (
            <Button asChild className="w-fit">
              <Link href="/dashboard">{t("home.goToDashboard")}</Link>
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/register">{t("home.getStarted")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">{t("common.signIn")}</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("home.projectStatus")}</CardTitle>
              <CardDescription>{t("home.phaseStatus")}</CardDescription>
            </CardHeader>
            <CardContent>
              <SupabaseStatus health={supabaseHealth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("home.gettingStarted")}</CardTitle>
              <CardDescription>
                {t("home.gettingStartedDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-sm">
                <li>
                  Copy <code className="text-foreground">.env.example</code> to{" "}
                  <code className="text-foreground">.env.local</code>
                </li>
                <li>
                  Run <code className="text-foreground">pnpm db:start</code> to
                  start Supabase locally
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-foreground hover:underline"
                  >
                    {t("home.stepRegister")}
                  </Link>{" "}
                  {t("home.or")}{" "}
                  <Link
                    href="/login"
                    className="text-foreground hover:underline"
                  >
                    {t("home.stepSignIn")}
                  </Link>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </PageShell>
  );
}
