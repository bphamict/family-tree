import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "@/lib/event/constants";
import { formatEventDate } from "@/lib/event/format";
import type { EventWithParticipants } from "@/types/event";

type PersonEventsSectionProps = {
  familyId: string;
  events: EventWithParticipants[];
};

export function PersonEventsSection({
  familyId,
  events,
}: PersonEventsSectionProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          Family events linked to this person.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/families/${familyId}/events/${event.id}/edit`}
            className="hover:bg-muted rounded-lg border p-4 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {formatEventDate(event.event_date)}
              </span>
            </div>
            <p className="mt-2 font-medium">{event.title}</p>
            {event.location && (
              <p className="text-muted-foreground mt-1 text-sm">
                {event.location}
              </p>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
