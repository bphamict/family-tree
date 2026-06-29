import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Network, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFamilyById } from "@/features/families/family-service";
import { PersonArchiveActions } from "@/features/persons/person-archive-actions";
import { getPersonById } from "@/features/persons/person-service";
import { PersonEventsSection } from "@/features/events/person-events-section";
import { getEventsForPerson } from "@/features/events/event-service";
import { LinkedDocumentsSection } from "@/features/documents/linked-documents-section";
import { getDocumentsByFamily } from "@/features/documents/document-service";
import { AddRelationshipForm } from "@/features/relationships/add-relationship-form";
import { RelationshipList } from "@/features/relationships/relationship-list";
import {
  getPersonOptionsForRelationships,
  getRelationshipsForPerson,
} from "@/features/relationships/relationship-service";
import {
  canManagePersons,
  canManageDocuments,
  canViewPersons,
} from "@/lib/family/permissions";
import { formatDisplayDate } from "@/lib/date/format";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPersonName } from "@/types/person";

type PersonDetailPageProps = {
  params: Promise<{ familyId: string; personId: string }>;
};

export async function generateMetadata({
  params,
}: PersonDetailPageProps): Promise<Metadata> {
  const t = await getTranslations();
  const { familyId, personId } = await params;
  const person = await getPersonById(familyId, personId);

  return {
    title: person ? formatPersonName(person) : t("person.profileTitle"),
  };
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const t = await getTranslations();
  const { familyId, personId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    notFound();
  }

  const person = await getPersonById(familyId, personId);

  if (!person) {
    notFound();
  }

  const canManage = canManagePersons(family.membership.role);
  const canManageDocs = canManageDocuments(family.membership.role);
  const isArchived = Boolean(person.archived_at);

  const [relationshipGroups, personOptions, personEvents, personDocuments] =
    await Promise.all([
      getRelationshipsForPerson(familyId, personId),
      canManage
        ? getPersonOptionsForRelationships(familyId, personId)
        : Promise.resolve([]),
      getEventsForPerson(familyId, personId),
      getDocumentsByFamily(familyId, { personId }),
    ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonAvatar person={person} size="lg" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {formatPersonName(person)}
                </h1>
                {isArchived && (
                  <Badge variant="secondary">{t("common.archived")}</Badge>
                )}
              </div>
              {person.other_name && (
                <p className="text-muted-foreground text-lg">
                  {person.other_name}
                </p>
              )}
              {person.occupation && (
                <p className="text-muted-foreground text-lg">
                  {person.occupation}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/families/${familyId}/tree?root=${personId}`}
                aria-label={t("common.viewInTree")}
              >
                <Network className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/families/${familyId}/persons`}
                aria-label={t("common.backToList")}
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{t("person.profileTitle")}</CardTitle>
              <CardDescription>
                {t("person.profileDescription")}
              </CardDescription>
            </div>
            {canManage && (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Link
                  href={`/families/${familyId}/persons/${personId}/edit`}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="size-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <ProfileField
              label={t("person.otherName")}
              value={person.other_name}
              notSetLabel={t("common.notSet")}
            />
            <ProfileField
              label={t("person.gender")}
              value={
                person.gender ? t(`person.genderLabels.${person.gender}`) : null
              }
              notSetLabel={t("common.notSet")}
            />
            <ProfileField
              label={t("person.birthDate")}
              value={formatDisplayDate(person.birth_date)}
              notSetLabel={t("common.notSet")}
            />
            <ProfileField
              label={t("person.deathDate")}
              value={formatDisplayDate(person.death_date)}
              notSetLabel={t("common.notSet")}
            />
            <ProfileField
              label={t("person.occupation")}
              value={person.occupation}
              notSetLabel={t("common.notSet")}
            />
            <div className="md:col-span-2">
              <ProfileField
                label={t("person.biography")}
                value={person.biography}
                multiline
                notSetLabel={t("common.notSet")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("relationship.title")}</CardTitle>
            <CardDescription>{t("relationship.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <RelationshipList
              familyId={familyId}
              personId={personId}
              groups={relationshipGroups}
              canManage={canManage}
            />
            {canManage && (
              <div className="border-t pt-6">
                <h3 className="mb-4 text-sm font-medium">
                  {t("relationship.addTitle")}
                </h3>
                <AddRelationshipForm
                  familyId={familyId}
                  personId={personId}
                  personOptions={personOptions}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <PersonEventsSection familyId={familyId} events={personEvents} />

        <LinkedDocumentsSection
          familyId={familyId}
          documents={personDocuments}
          canManage={canManageDocs}
          description={t("person.documentsDescription")}
          uploadHref={`/families/${familyId}/documents/new?personId=${personId}`}
        />

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>{t("person.archiveTitle")}</CardTitle>
              <CardDescription>
                {t("person.archiveDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonArchiveActions familyId={familyId} person={person} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ProfileField({
  label,
  value,
  multiline = false,
  notSetLabel,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  notSetLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground">{label}</p>
      {multiline ? (
        <p className="whitespace-pre-wrap">{value ?? notSetLabel}</p>
      ) : (
        <p className="font-medium">{value ?? notSetLabel}</p>
      )}
    </div>
  );
}
