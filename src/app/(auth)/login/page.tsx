import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("auth.signInTitle") };
}

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.signInTitle")}</CardTitle>
        <CardDescription>{t("auth.signInDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <p className="text-muted-foreground text-sm">
              {t("common.loading")}
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
