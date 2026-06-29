export const EVENT_TYPES = [
  "birth",
  "death",
  "wedding",
  "memorial",
  "reunion",
  "other",
] as const;

export type EventTypeConstant = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventTypeConstant, string> = {
  birth: "Birth",
  death: "Death",
  wedding: "Wedding",
  memorial: "Memorial",
  reunion: "Reunion",
  other: "Family event",
};

export const EVENT_TYPE_COLORS: Record<EventTypeConstant, string> = {
  birth:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  death: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  wedding: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  memorial:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  reunion: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  other: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
};
