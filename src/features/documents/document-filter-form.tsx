"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PersonSelect } from "@/components/shared/person-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/document/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { DocumentSearchFilters, DocumentType } from "@/types/document";
import type { Person } from "@/types/person";
import type { Event } from "@/types/event";

type DocumentFilterFormProps = {
  filters: DocumentSearchFilters;
  persons: Person[];
  events: Event[];
};

export function DocumentFilterForm({
  filters,
  persons,
  events,
}: DocumentFilterFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(next: Partial<DocumentSearchFilters>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `?${query}` : "?");
    });
  }

  const hasFilters = Boolean(
    filters.documentType || filters.personId || filters.eventId,
  );

  return (
    <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-4">
      <div className="grid gap-2">
        <Label htmlFor="documentType">{t("common.type")}</Label>
        <Select
          value={filters.documentType ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              documentType:
                value === "all" ? undefined : (value as DocumentType),
            })
          }
          disabled={isPending}
        >
          <SelectTrigger id="documentType">
            <SelectValue placeholder={t("common.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allTypes")}</SelectItem>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`document.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="personId">{t("common.person")}</Label>
        <PersonSelect
          id="personId"
          persons={persons}
          value={filters.personId ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              personId: value === "all" ? undefined : value,
            })
          }
          emptyOption={{ value: "all", label: t("common.allPersons") }}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="eventId">{t("common.event")}</Label>
        <Select
          value={filters.eventId ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              eventId: value === "all" ? undefined : value,
            })
          }
          disabled={isPending}
        >
          <SelectTrigger id="eventId">
            <SelectValue placeholder={t("common.allEvents")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allEvents")}</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              updateFilters({
                documentType: undefined,
                personId: undefined,
                eventId: undefined,
              })
            }
          >
            {t("common.clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}
