import { formatDisplayDate } from "@/lib/date/format";

export function formatEventDate(date: string): string {
  return formatDisplayDate(date) ?? date;
}
