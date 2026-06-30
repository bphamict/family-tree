"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matchesSearch } from "@/lib/string/normalize-search";
import { useTranslations } from "@/lib/i18n/use-translator";
import { formatPersonName, type Person } from "@/types/person";

type ParticipantSelectProps = {
  persons: Person[];
  selectedIds: string[];
  disabled?: boolean;
};

export function ParticipantSelect({
  persons,
  selectedIds,
  disabled = false,
}: ParticipantSelectProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim();
  const filteredPersons = persons.filter((person) =>
    matchesSearch(formatPersonName(person), normalizedQuery),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="participantSearch">{t("common.participants")}</Label>
        <Input
          id="participantSearch"
          placeholder={t("event.searchParticipants")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
        />
      </div>

      {persons.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("event.noMembersForParticipants")}
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-md border p-3">
          <div className="flex flex-col gap-2">
            {filteredPersons.map((person) => (
              <label
                key={person.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="participantIds"
                  value={person.id}
                  defaultChecked={selectedIds.includes(person.id)}
                  disabled={disabled}
                  className="size-4 rounded border"
                />
                <span>{formatPersonName(person)}</span>
              </label>
            ))}
            {filteredPersons.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("event.noSearchResults")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
