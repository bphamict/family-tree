export function formatDisplayDate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const year = String(parsed.getUTCFullYear());

    return `${day}/${month}/${year}`;
  }

  return value;
}

export function formatLifespan(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
): string | null {
  if (!birthDate && !deathDate) {
    return null;
  }

  if (birthDate && deathDate) {
    return `${formatDisplayDate(birthDate)} – ${formatDisplayDate(deathDate)}`;
  }

  return formatDisplayDate(birthDate ?? deathDate);
}
