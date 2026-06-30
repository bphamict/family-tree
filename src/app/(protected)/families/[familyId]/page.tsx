import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Network,
  Plus,
  Upload,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FamilySettingsDialog } from "@/features/families/edit-family-form";
import { getFamilyById } from "@/features/families/family-service";
import { getDocumentCount } from "@/features/documents/document-service";
import { getEventCount } from "@/features/events/event-service";
import { getPersonCount } from "@/features/persons/person-service";
import {
  canArchiveFamily,
  canInviteMembers,
  canManageDocuments,
  canManageEvents,
  canManageFamily,
  canManagePersons,
  canViewDocuments,
  canViewEvents,
  canViewPersons,
} from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type FamilyDetailPageProps = {
  params: Promise<{ familyId: string }>;
};

type WidgetItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export default async function FamilyDetailPage({
  params,
}: FamilyDetailPageProps) {
  const t = await getTranslations();
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

  const isArchived = Boolean(family.archived_at);
  const showSettings = canManage || canArchive;

  const widgets: WidgetItem[] = [
    canView && personCount > 0
      ? {
          href: `/families/${family.id}/tree`,
          label: t("family.viewTree"),
          icon: Network,
        }
      : null,
    canView
      ? {
          href: `/families/${family.id}/persons`,
          label: t("family.hub.persons"),
          icon: Users,
          count: personCount,
        }
      : null,
    canViewTimeline
      ? {
          href: `/families/${family.id}/timeline`,
          label: t("family.hub.events"),
          icon: Calendar,
          count: eventCount,
        }
      : null,
    canViewArchive
      ? {
          href: `/families/${family.id}/documents`,
          label: t("family.hub.documents"),
          icon: FileText,
          count: documentCount,
        }
      : null,
    canManagePersonsRole
      ? {
          href: `/families/${family.id}/persons/new`,
          label: t("family.addPerson"),
          icon: Plus,
        }
      : null,
    canManageEventsRole
      ? {
          href: `/families/${family.id}/events/new`,
          label: t("family.addEvent"),
          icon: Calendar,
        }
      : null,
    canManageDocumentsRole
      ? {
          href: `/families/${family.id}/documents/new`,
          label: t("family.uploadDocument"),
          icon: Upload,
        }
      : null,
    canInvite
      ? {
          href: `/families/${family.id}/members`,
          label: t("family.manageAccess"),
          icon: UsersRound,
        }
      : null,
  ].filter((item): item is WidgetItem => item !== null);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <header className="flex flex-col gap-3">
          <PageHeader
            actions={
              <>
                {showSettings && (
                  <FamilySettingsDialog
                    family={family}
                    canManage={canManage}
                    canArchive={canArchive}
                  />
                )}
                <Button asChild variant="outline" size="icon">
                  <Link
                    href="/families"
                    aria-label={t("common.backToFamilies")}
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </>
            }
          >
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {family.name}
            </h1>
          </PageHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {t(`family.roles.${family.membership.role}`)}
            </Badge>
            {isArchived && (
              <Badge variant="secondary">{t("common.archived")}</Badge>
            )}
          </div>
          {family.description && (
            <p className="text-muted-foreground text-sm">
              {family.description}
            </p>
          )}
        </header>

        {widgets.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {widgets.map((widget) => (
              <Link
                key={widget.href}
                href={widget.href}
                className="hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-20 items-center gap-4 rounded-xl border px-6 py-5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                  <widget.icon className="size-6" aria-hidden />
                </div>
                <span className="flex-1 text-base font-medium">
                  {widget.label}
                </span>
                {widget.count !== undefined && (
                  <span className="text-2xl font-semibold tabular-nums">
                    {widget.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}
