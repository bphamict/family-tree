import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EventFilterForm } from "@/features/events/event-filter-form";
import { getEventsByFamily } from "@/features/events/event-service";
import { TimelineView } from "@/features/events/timeline-view";
import { getFamilyById } from "@/features/families/family-service";
import { canManageEvents, canViewEvents } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import type { EventSearchFilters, EventType } from "@/types/event";

type TimelinePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("event.timelineTitle") };
}

function parseSearchFilters(
  searchParams: Record<string, string | string[] | undefined>,
): EventSearchFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const eventType = getValue("eventType");

  return {
    eventType: eventType ? (eventType as EventType) : undefined,
    year: getValue("year"),
  };
}

export default async function TimelinePage({
  params,
  searchParams,
}: TimelinePageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewEvents()) {
    notFound();
  }

  const filters = parseSearchFilters(resolvedSearchParams);
  const events = await getEventsByFamily(familyId, filters);
  const canManage = canManageEvents(family.membership.role);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <PageHeader
          actions={
            <>
              {canManage && (
                <Button asChild size="icon">
                  <Link
                    href={`/families/${familyId}/events/new`}
                    aria-label={t("family.addEvent")}
                  >
                    <Plus className="size-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="icon">
                <Link
                  href={`/families/${familyId}`}
                  aria-label={t("common.backToFamily")}
                >
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("event.timelineHeading", { familyName: family.name })}
            </h1>
            <p className="text-muted-foreground">
              {t("event.timelineDescription", { count: events.length })}
            </p>
          </div>
        </PageHeader>

        <Suspense fallback={<div className="h-24 rounded-lg border" />}>
          <EventFilterForm filters={filters} />
        </Suspense>

        <TimelineView
          familyId={familyId}
          events={events}
          canManage={canManage}
        />
      </PageContainer>
    </PageShell>
  );
}
