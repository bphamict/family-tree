import Link from "next/link";

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
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "@/lib/event/constants";
import { formatEventDate } from "@/lib/event/format";
import { formatPersonName } from "@/types/person";
import type { EventWithParticipants } from "@/types/event";

type EventCardProps = {
  familyId: string;
  event: EventWithParticipants;
  canManage: boolean;
};

export function EventCard({ familyId, event, canManage }: EventCardProps) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {formatEventDate(event.event_date)}
              </span>
            </div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            {event.location && (
              <CardDescription>{event.location}</CardDescription>
            )}
          </div>
          {canManage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/families/${familyId}/events/${event.id}/edit`}>
                Edit
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {event.description && (
          <p className="text-sm whitespace-pre-wrap">{event.description}</p>
        )}

        {event.participants.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium">
              Participants
            </p>
            <div className="flex flex-wrap gap-2">
              {event.participants.map((participant) => (
                <Link
                  key={participant.id}
                  href={`/families/${familyId}/persons/${participant.person_id}`}
                  className="hover:bg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
                >
                  <PersonAvatar
                    person={{
                      first_name: participant.first_name,
                      middle_name: participant.middle_name,
                      last_name: participant.last_name,
                      avatar_url: participant.avatar_url,
                    }}
                    size="sm"
                  />
                  <span>{formatPersonName(participant)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
