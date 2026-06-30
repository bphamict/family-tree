import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFamilyById } from "@/features/families/family-service";
import { PersonForm } from "@/features/persons/person-form";
import { canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type NewPersonPageProps = {
  params: Promise<{ familyId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("person.addTitle") };
}

export default async function NewPersonPage({ params }: NewPersonPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    notFound();
  }

  return (
    <PageShell>
      <AppHeader />

      <PageContainer size="narrow">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/persons`}>
                {t("common.cancel")}
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("person.addTitle")}
            </h1>
            <p className="text-muted-foreground">
              {t("person.addDescription", { familyName: family.name })}
            </p>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>{t("person.addFormTitle")}</CardTitle>
            <CardDescription>{t("person.addFormDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PersonForm familyId={familyId} mode="create" />
          </CardContent>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
