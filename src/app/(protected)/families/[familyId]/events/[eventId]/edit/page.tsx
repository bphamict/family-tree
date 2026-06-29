import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventDeleteButton } from "@/features/events/event-delete-button";
import { EventForm } from "@/features/events/event-form";
import { getEventById } from "@/features/events/event-service";
import { LinkedDocumentsSection } from "@/features/documents/linked-documents-section";
import { getDocumentsByFamily } from "@/features/documents/document-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManageEvents } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type EditEventPageProps = {
  params: Promise<{ familyId: string; eventId: string }>;
};

export async function generateMetadata({
  params,
}: EditEventPageProps): Promise<Metadata> {
  const t = await getTranslations();
  const { familyId, eventId } = await params;
  const event = await getEventById(familyId, eventId);

  return {
    title: event
      ? `${t("event.editHeading")}: ${event.title}`
      : t("event.editTitle"),
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const t = await getTranslations();
  const { familyId, eventId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManageEvents(family.membership.role)) {
    notFound();
  }

  const [event, persons, eventDocuments] = await Promise.all([
    getEventById(familyId, eventId),
    getPersonsByFamily(familyId),
    getDocumentsByFamily(familyId, { eventId }),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("event.editHeading")}
            </h1>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}/timeline`}>
              {t("common.backToTimeline")}
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("event.editFormTitle")}</CardTitle>
            <CardDescription>{t("event.editFormDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              familyId={familyId}
              persons={persons}
              event={event}
              mode="edit"
            />
          </CardContent>
        </Card>

        <LinkedDocumentsSection
          familyId={familyId}
          documents={eventDocuments}
          canManage
          title={t("event.eventDocumentsTitle")}
          description={t("event.eventDocumentsDescription")}
          uploadHref={`/families/${familyId}/documents/new?eventId=${eventId}`}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("event.deleteTitle")}</CardTitle>
            <CardDescription>{t("event.deleteDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <EventDeleteButton familyId={familyId} eventId={eventId} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
