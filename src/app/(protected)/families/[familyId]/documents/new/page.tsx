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
import { DocumentUploadForm } from "@/features/documents/document-upload-form";
import { getEventsByFamily } from "@/features/events/event-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManageDocuments } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type NewDocumentPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("document.uploadTitle") };
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function NewDocumentPage({
  params,
  searchParams,
}: NewDocumentPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canManageDocuments(family.membership.role)) {
    notFound();
  }

  const defaultPersonId = getSearchParam(resolvedSearchParams, "personId");
  const defaultEventId = getSearchParam(resolvedSearchParams, "eventId");

  const [persons, events] = await Promise.all([
    getPersonsByFamily(familyId),
    getEventsByFamily(familyId),
  ]);

  const redirectTo = defaultPersonId
    ? `/families/${familyId}/persons/${defaultPersonId}`
    : defaultEventId
      ? `/families/${familyId}/events/${defaultEventId}/edit`
      : `/families/${familyId}/documents`;

  return (
    <PageShell>
      <AppHeader />

      <PageContainer size="narrow">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/documents`}>
                {t("common.cancel")}
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("document.uploadHeading")}
            </h1>
            <p className="text-muted-foreground">
              {t("document.uploadDescription", { familyName: family.name })}
            </p>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>{t("document.uploadFormTitle")}</CardTitle>
            <CardDescription>
              {t("document.uploadFormDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadForm
              familyId={familyId}
              persons={persons}
              events={events}
              defaultPersonId={defaultPersonId}
              defaultEventId={defaultEventId}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
