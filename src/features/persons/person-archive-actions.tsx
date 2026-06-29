"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archivePersonAction,
  restorePersonAction,
} from "@/features/persons/person-actions";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { Person } from "@/types/person";

type PersonArchiveActionsProps = {
  familyId: string;
  person: Person;
};

export function PersonArchiveActions({
  familyId,
  person,
}: PersonArchiveActionsProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const isArchived = Boolean(person.archived_at);

  function handleArchiveToggle() {
    startTransition(async () => {
      const result = isArchived
        ? await restorePersonAction(familyId, person.id)
        : await archivePersonAction(familyId, person.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <Button
      type="button"
      variant={isArchived ? "outline" : "destructive"}
      onClick={handleArchiveToggle}
      disabled={isPending}
    >
      {isPending
        ? t("common.saving")
        : isArchived
          ? t("person.restorePerson")
          : t("person.archivePerson")}
    </Button>
  );
}
