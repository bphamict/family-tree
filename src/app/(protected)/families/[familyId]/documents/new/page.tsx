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
import { DocumentUploadForm } from "@/features/documents/document-upload-form";
import { getEventsByFamily } from "@/features/events/event-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManageDocuments } from "@/lib/family/permissions";

type NewDocumentPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Upload document",
};

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

  const redirectTo =
    defaultPersonId
      ? `/families/${familyId}/persons/${defaultPersonId}`
      : defaultEventId
        ? `/families/${familyId}/events/${defaultEventId}/edit`
        : `/families/${familyId}/documents`;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Upload document
            </h1>
            <p className="text-muted-foreground">
              Add photos, PDFs, or videos to {family.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}/documents`}>Cancel</Link>
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Document details</CardTitle>
            <CardDescription>
              Files are stored securely and can be linked to family members or
              events.
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
      </main>
    </div>
  );
}
