import { EventCard } from "@/features/events/event-card";
import type { EventWithParticipants } from "@/types/event";

type TimelineViewProps = {
  familyId: string;
  events: EventWithParticipants[];
  canManage: boolean;
};

type TimelineGroup = {
  year: string;
  events: EventWithParticipants[];
};

function groupEventsByYear(events: EventWithParticipants[]): TimelineGroup[] {
  const groups = new Map<string, EventWithParticipants[]>();

  for (const event of events) {
    const year = event.event_date.slice(0, 4);
    const existing = groups.get(year) ?? [];
    existing.push(event);
    groups.set(year, existing);
  }

  return Array.from(groups.entries())
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, groupedEvents]) => ({
      year,
      events: groupedEvents,
    }));
}

export function TimelineView({
  familyId,
  events,
  canManage,
}: TimelineViewProps) {
  const groups = groupEventsByYear(events);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No events match your filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.year} className="relative">
          <div className="mb-4 flex items-center gap-4">
            <div className="bg-primary size-3 rounded-full" />
            <h2 className="text-2xl font-semibold tracking-tight">
              {group.year}
            </h2>
          </div>

          <div className="border-muted ml-1.5 flex flex-col gap-4 border-l pl-8">
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                familyId={familyId}
                event={event}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
