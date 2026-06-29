"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteEventAction } from "@/features/events/event-actions";

type EventDeleteButtonProps = {
  familyId: string;
  eventId: string;
};

export function EventDeleteButton({
  familyId,
  eventId,
}: EventDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this event? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteEventAction(familyId, eventId);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete event"}
    </Button>
  );
}
