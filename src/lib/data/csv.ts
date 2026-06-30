const CSV_DELIMITER = ",";

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function stringifyCsv(
  headers: string[],
  rows: Array<Record<string, string | null | undefined>>,
): string {
  const lines = [headers.join(CSV_DELIMITER)];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCsvValue(value ?? "");
    });
    lines.push(values.join(CSV_DELIMITER));
  }

  return `${lines.join("\n")}\n`;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === CSV_DELIMITER && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

export function parseCsv(content: string): {
  headers: string[];
  rows: string[][];
} {
  const normalized = content.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return { headers: [], rows: [] };
  }

  const lines = normalized
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map(parseCsvLine);

  return { headers, rows };
}

export function rowToRecord(
  headers: string[],
  row: string[],
): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (!header) {
      return;
    }

    record[header] = (row[index] ?? "").trim();
  });

  return record;
}

export function splitRefList(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
