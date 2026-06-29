import type { Metadata } from "next";
import Link from "next/link";
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
import { GENDER_LABELS } from "@/lib/person/constants";
import { formatPersonName } from "@/types/person";

type PersonDetailPageProps = {
  params: Promise<{ familyId: string; personId: string }>;
};

export async function generateMetadata({
  params,
}: PersonDetailPageProps): Promise<Metadata> {
  const { familyId, personId } = await params;
  const person = await getPersonById(familyId, personId);

  return {
    title: person ? formatPersonName(person) : "Person profile",
  };
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
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
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <PersonAvatar person={person} size="lg" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {formatPersonName(person)}
                </h1>
                {isArchived && <Badge variant="secondary">Archived</Badge>}
              </div>
              {person.occupation && (
                <p className="text-muted-foreground text-lg">
                  {person.occupation}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/tree?root=${personId}`}>
                View in tree
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/persons`}>Back to list</Link>
            </Button>
            {canManage && (
              <Button asChild>
                <Link href={`/families/${familyId}/persons/${personId}/edit`}>
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Genealogy details for this person.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <ProfileField
              label="Gender"
              value={person.gender ? GENDER_LABELS[person.gender] : null}
            />
            <ProfileField label="Birth date" value={person.birth_date} />
            <ProfileField label="Death date" value={person.death_date} />
            <ProfileField label="Occupation" value={person.occupation} />
            <div className="md:col-span-2">
              <ProfileField label="Biography" value={person.biography} multiline />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
            <CardDescription>
              Parents, children, spouses, and other family connections.
            </CardDescription>
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
                <h3 className="mb-4 text-sm font-medium">Add relationship</h3>
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
          description="Photos, certificates, and other files linked to this person."
          uploadHref={`/families/${familyId}/documents/new?personId=${personId}`}
        />

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Archive</CardTitle>
              <CardDescription>
                Archived persons are hidden from the default list but remain in
                the family record.
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
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground">{label}</p>
      {multiline ? (
        <p className="whitespace-pre-wrap">{value ?? "Not set"}</p>
      ) : (
        <p className="font-medium">{value ?? "Not set"}</p>
      )}
    </div>
  );
}
