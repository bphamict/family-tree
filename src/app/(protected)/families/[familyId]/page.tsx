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
import { EditFamilyForm } from "@/features/families/edit-family-form";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonCount } from "@/features/persons/person-service";
import { getEventCount } from "@/features/events/event-service";
import { getDocumentCount } from "@/features/documents/document-service";
import {
  canArchiveFamily,
  canManageFamily,
  canInviteMembers,
  canManagePersons,
  canManageEvents,
  canManageDocuments,
  canViewPersons,
  canViewEvents,
  canViewDocuments,
} from "@/lib/family/permissions";
import { ROLE_LABELS } from "@/lib/family/constants";

type FamilyDetailPageProps = {
  params: Promise<{ familyId: string }>;
};

export default async function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family) {
    notFound();
  }

  const canManage = canManageFamily(family.membership.role);
  const canArchive = canArchiveFamily(family.membership.role);
  const canInvite = canInviteMembers(family.membership.role);
  const canView = canViewPersons();
  const canViewTimeline = canViewEvents();
  const canViewArchive = canViewDocuments();
  const canManagePersonsRole = canManagePersons(family.membership.role);
  const canManageEventsRole = canManageEvents(family.membership.role);
  const canManageDocumentsRole = canManageDocuments(family.membership.role);
  const [personCount, eventCount, documentCount] = await Promise.all([
    canView ? getPersonCount(familyId) : Promise.resolve(0),
    canViewTimeline ? getEventCount(familyId) : Promise.resolve(0),
    canViewArchive ? getDocumentCount(familyId) : Promise.resolve(0),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {family.name}
              </h1>
              <p className="text-muted-foreground">
                Your role: {ROLE_LABELS[family.membership.role]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canView && personCount > 0 && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/tree`}>View tree</Link>
                </Button>
              )}
              {canView && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/persons`}>
                    View persons ({personCount})
                  </Link>
                </Button>
              )}
              {canViewTimeline && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/timeline`}>
                    View timeline ({eventCount})
                  </Link>
                </Button>
              )}
              {canViewArchive && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/documents`}>
                    View archive ({documentCount})
                  </Link>
                </Button>
              )}
              {canInvite && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/members`}>
                    Manage access
                  </Link>
                </Button>
              )}
              {canManagePersonsRole && (
                <Button asChild>
                  <Link href={`/families/${familyId}/persons/new`}>
                    Add person
                  </Link>
                </Button>
              )}
              {canManageEventsRole && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/events/new`}>
                    Add event
                  </Link>
                </Button>
              )}
              {canManageDocumentsRole && (
                <Button asChild variant="outline">
                  <Link href={`/families/${familyId}/documents/new`}>
                    Upload document
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Family settings</CardTitle>
            <CardDescription>
              Update family information or archive this family.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditFamilyForm
              family={family}
              canManage={canManage}
              canArchive={canArchive}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
