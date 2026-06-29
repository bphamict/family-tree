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
import { uploadDocumentAction } from "@/features/documents/document-actions";
import { DOCUMENT_ACCEPT_TYPES } from "@/lib/document/constants";
import type { Event } from "@/types/event";
import { formatPersonName, type Person } from "@/types/person";

type DocumentUploadFormProps = {
  familyId: string;
  persons: Person[];
  events: Event[];
  defaultPersonId?: string;
  defaultEventId?: string;
  redirectTo?: string;
};

export function DocumentUploadForm({
  familyId,
  persons,
  events,
  defaultPersonId,
  defaultEventId,
  redirectTo,
}: DocumentUploadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [personId, setPersonId] = useState(defaultPersonId ?? "");
  const [eventId, setEventId] = useState(defaultEventId ?? "");

  function handleSubmit(formData: FormData) {
    if (personId) {
      formData.set("personId", personId);
    }

    if (eventId) {
      formData.set("eventId", eventId);
    }

    startTransition(async () => {
      const result = await uploadDocumentAction(familyId, formData, {
        redirectTo,
      });

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
          placeholder="Optional — defaults to file name"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept={DOCUMENT_ACCEPT_TYPES}
          required
          disabled={isPending}
        />
        <p className="text-muted-foreground text-xs">
          Images, PDFs, and videos up to 50 MB.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="personId">Link to person</Label>
          <Select
            value={personId || "none"}
            onValueChange={(value) =>
              setPersonId(value === "none" ? "" : value)
            }
            disabled={isPending || Boolean(defaultPersonId)}
          >
            <SelectTrigger id="personId">
              <SelectValue placeholder="No person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No person</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {formatPersonName(person)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="eventId">Link to event</Label>
          <Select
            value={eventId || "none"}
            onValueChange={(value) => setEventId(value === "none" ? "" : value)}
            disabled={isPending || Boolean(defaultEventId)}
          >
            <SelectTrigger id="eventId">
              <SelectValue placeholder="No event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No event</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}
