"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createEventAction,
  updateEventAction,
} from "@/features/events/event-actions";
import { ParticipantSelect } from "@/features/events/participant-select";
import { EVENT_TYPE_LABELS, EVENT_TYPES } from "@/lib/event/constants";
import type { EventType, EventWithParticipants } from "@/types/event";
import type { Person } from "@/types/person";

type EventFormProps = {
  familyId: string;
  persons: Person[];
  event?: EventWithParticipants;
  mode: "create" | "edit";
};

export function EventForm({ familyId, persons, event, mode }: EventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [eventType, setEventType] = useState<EventType>(
    event?.event_type ?? "other",
  );

  function handleSubmit(formData: FormData) {
    formData.set("eventType", eventType);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEventAction(familyId, formData)
          : await updateEventAction(familyId, event!.id, formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.success) {
        toast.success(result.success);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={event?.title ?? ""}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="eventType">Event type</Label>
          <Select
            value={eventType}
            onValueChange={(value) => setEventType(value as EventType)}
            disabled={isPending}
          >
            <SelectTrigger id="eventType">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="eventDate">Event date</Label>
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            defaultValue={event?.event_date ?? ""}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={event?.location ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event?.description ?? ""}
          disabled={isPending}
        />
      </div>

      <ParticipantSelect
        persons={persons}
        selectedIds={event?.participants.map((participant) => participant.person_id) ?? []}
        disabled={isPending}
      />

      <Button type="submit" disabled={isPending}>
        {isPending
          ? mode === "create"
            ? "Creating..."
            : "Saving..."
          : mode === "create"
            ? "Create event"
            : "Save changes"}
      </Button>
    </form>
  );
}
