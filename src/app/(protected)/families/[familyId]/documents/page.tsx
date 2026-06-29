import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { DocumentFilterForm } from "@/features/documents/document-filter-form";
import { DocumentGallery } from "@/features/documents/document-gallery";
import { getDocumentsByFamily } from "@/features/documents/document-service";
import { getEventsByFamily } from "@/features/events/event-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import {
  canManageDocuments,
  canViewDocuments,
} from "@/lib/family/permissions";
import type { DocumentSearchFilters, DocumentType } from "@/types/document";

type DocumentsPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Family archive",
};

function parseSearchFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DocumentSearchFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const documentType = getValue("documentType");

  return {
    documentType: documentType
      ? (documentType as DocumentType)
      : undefined,
    personId: getValue("personId"),
    eventId: getValue("eventId"),
  };
}

export default async function DocumentsPage({
  params,
  searchParams,
}: DocumentsPageProps) {
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewDocuments()) {
    notFound();
  }

  const filters = parseSearchFilters(resolvedSearchParams);
  const canManage = canManageDocuments(family.membership.role);

  const [documents, persons, events] = await Promise.all([
    getDocumentsByFamily(familyId, filters),
    getPersonsByFamily(familyId),
    getEventsByFamily(familyId),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {family.name} archive
            </h1>
            <p className="text-muted-foreground">
              {documents.length} document{documents.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}`}>Back to family</Link>
            </Button>
            {canManage && (
              <Button asChild>
                <Link href={`/families/${familyId}/documents/new`}>
                  Upload document
                </Link>
              </Button>
            )}
          </div>
        </section>

        <Suspense fallback={<div className="h-24 rounded-lg border" />}>
          <DocumentFilterForm
            filters={filters}
            persons={persons}
            events={events}
          />
        </Suspense>

        <DocumentGallery
          familyId={familyId}
          documents={documents}
          canManage={canManage}
        />
      </main>
    </div>
  );
}
