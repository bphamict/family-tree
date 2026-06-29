"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteEventAction } from "@/features/events/event-actions";
import { useTranslations } from "@/lib/i18n/use-translator";

type EventDeleteButtonProps = {
  familyId: string;
  eventId: string;
};

export function EventDeleteButton({
  familyId,
  eventId,
}: EventDeleteButtonProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      t("event.deleteConfirm", { confirm: t("common.confirmDelete") }),
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
      {isPending ? t("common.deleting") : t("event.deleteEvent")}
    </Button>
  );
}
