"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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
import { EVENT_TYPE_LABELS, EVENT_TYPES } from "@/lib/event/constants";
import type { EventSearchFilters, EventType } from "@/types/event";

type EventFilterFormProps = {
  filters: EventSearchFilters;
};

export function EventFilterForm({ filters }: EventFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(next: Partial<EventSearchFilters>) {
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

  return (
    <form
      className="grid gap-4 rounded-lg border p-4 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        updateFilters({
          eventType: (formData.get("eventType") as EventType) || undefined,
          year: (formData.get("year") as string) || undefined,
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="eventType">Event type</Label>
        <Select
          value={filters.eventType ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              eventType: value === "all" ? undefined : (value as EventType),
            })
          }
          disabled={isPending}
        >
          <SelectTrigger id="eventType">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          name="year"
          placeholder="e.g. 1990"
          defaultValue={filters.year ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" disabled={isPending}>
          Apply filters
        </Button>
        {(filters.eventType || filters.year) && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => updateFilters({ eventType: undefined, year: undefined })}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
