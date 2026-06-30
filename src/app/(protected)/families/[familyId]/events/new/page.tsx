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
import { EventForm } from "@/features/events/event-form";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManageEvents } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type NewEventPageProps = {
  params: Promise<{ familyId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("event.addTitle") };
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManageEvents(family.membership.role)) {
    notFound();
  }

  const persons = await getPersonsByFamily(familyId);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer size="narrow">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/timeline`}>
                {t("common.cancel")}
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("event.addTitle")}
            </h1>
            <p className="text-muted-foreground">
              {t("event.addDescription", { familyName: family.name })}
            </p>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>{t("event.addFormTitle")}</CardTitle>
            <CardDescription>{t("event.addFormDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm familyId={familyId} persons={persons} mode="create" />
          </CardContent>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
