import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { EventFilterForm } from "@/features/events/event-filter-form";
import { getEventsByFamily } from "@/features/events/event-service";
import { TimelineView } from "@/features/events/timeline-view";
import { getFamilyById } from "@/features/families/family-service";
import {
  canManageEvents,
  canViewEvents,
} from "@/lib/family/permissions";
import type { EventSearchFilters, EventType } from "@/types/event";

type TimelinePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Family timeline",
};

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
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {family.name} timeline
            </h1>
            <p className="text-muted-foreground">
              {events.length} event{events.length === 1 ? "" : "s"} in
              chronological order
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}`}>Back to family</Link>
            </Button>
            {canManage && (
              <Button asChild>
                <Link href={`/families/${familyId}/events/new`}>
                  Add event
                </Link>
              </Button>
            )}
          </div>
        </section>

        <Suspense fallback={<div className="h-24 rounded-lg border" />}>
          <EventFilterForm filters={filters} />
        </Suspense>

        <TimelineView
          familyId={familyId}
          events={events}
          canManage={canManage}
        />
      </main>
    </div>
  );
}
