import type { Metadata } from "next";

import { AppHeader } from "@/components/shared/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateFamilyForm } from "@/features/families/create-family-form";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("family.createTitle") };
}

export default async function NewFamilyPage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("family.createHeading")}
          </h1>
          <p className="text-muted-foreground">
            {t("family.createDescription")}
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("family.createFormTitle")}</CardTitle>
            <CardDescription>
              {t("family.createFormDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateFamilyForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
