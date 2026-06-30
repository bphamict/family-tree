export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

export function matchesSearch(text: string, query: string): boolean {
  const normalizedQuery = normalizeForSearch(query.trim());

  if (!normalizedQuery) {
    return true;
  }

  return normalizeForSearch(text).includes(normalizedQuery);
}
