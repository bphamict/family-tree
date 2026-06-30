import { randomUUID } from "crypto";

import { parseCsvPersonRows } from "@/features/data/data-export-service";
import { createClient } from "@/lib/supabase/server";
import { splitRefList } from "@/lib/data/csv";
import { PERSON_GENDERS } from "@/lib/person/constants";
import type {
  ExportEventRecord,
  ExportPersonRecord,
  ExportRelationshipRecord,
  FamilyExportBundle,
  ImportResult,
} from "@/types/data-export";
import { FAMILY_EXPORT_VERSION } from "@/types/data-export";
import type { PersonGender } from "@/types/person";
import type { StoredRelationshipType } from "@/types/relationship";

type ParsedImportBundle = {
  persons: ExportPersonRecord[];
  relationships: ExportRelationshipRecord[];
  events: ExportEventRecord[];
  warnings: string[];
};

const STORED_RELATIONSHIP_TYPES: StoredRelationshipType[] = [
  "parent",
  "spouse",
  "adoptive_parent",
  "guardian",
];

function emptyValue(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

function parseGender(value: string | null | undefined): PersonGender | null {
  if (!value) {
    return null;
  }

  return PERSON_GENDERS.includes(value as PersonGender)
    ? (value as PersonGender)
    : null;
}

function parseJsonBundle(content: string): ParsedImportBundle {
  const parsed = JSON.parse(content) as FamilyExportBundle;
  const warnings: string[] = [];

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON export file.");
  }

  if (parsed.version !== FAMILY_EXPORT_VERSION) {
    warnings.push(`Unsupported export version: ${String(parsed.version)}`);
  }

  return {
    persons: Array.isArray(parsed.persons) ? parsed.persons : [],
    relationships: Array.isArray(parsed.relationships)
      ? parsed.relationships
      : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
    warnings,
  };
}

function csvRowsToBundle(
  rows: ReturnType<typeof parseCsvPersonRows>,
): ParsedImportBundle {
  const persons: ExportPersonRecord[] = [];
  const relationships: ExportRelationshipRecord[] = [];
  const warnings: string[] = [];
  const spousePairs = new Set<string>();

  for (const [index, row] of rows.entries()) {
    if (!row.first_name.trim() || !row.last_name.trim()) {
      warnings.push(
        `Row ${index + 1}: skipped because first or last name is missing.`,
      );
      continue;
    }

    persons.push({
      ref: row.ref,
      first_name: row.first_name.trim(),
      middle_name: emptyValue(row.middle_name),
      last_name: row.last_name.trim(),
      other_name: emptyValue(row.other_name),
      gender: parseGender(row.gender),
      birth_date: emptyValue(row.birth_date),
      death_date: emptyValue(row.death_date),
      biography: emptyValue(row.biography),
      occupation: emptyValue(row.occupation),
    });

    if (row.father_ref?.trim()) {
      relationships.push({
        person1_ref: row.father_ref.trim(),
        person2_ref: row.ref,
        relationship_type: "parent",
        start_date: null,
        end_date: null,
        birth_order: null,
      });
    }

    if (row.mother_ref?.trim()) {
      relationships.push({
        person1_ref: row.mother_ref.trim(),
        person2_ref: row.ref,
        relationship_type: "parent",
        start_date: null,
        end_date: null,
        birth_order: null,
      });
    }

    for (const spouseRef of splitRefList(row.spouse_refs ?? undefined)) {
      const pairKey = [row.ref, spouseRef].sort().join(":");
      if (spousePairs.has(pairKey)) {
        continue;
      }

      spousePairs.add(pairKey);
      relationships.push({
        person1_ref: row.ref,
        person2_ref: spouseRef,
        relationship_type: "spouse",
        start_date: null,
        end_date: null,
        birth_order: null,
      });
    }
  }

  return { persons, relationships, events: [], warnings };
}

function relationshipKey(
  person1Ref: string,
  person2Ref: string,
  relationshipType: StoredRelationshipType,
): string {
  return `${person1Ref}:${person2Ref}:${relationshipType}`;
}

export async function importFamilyData(
  familyId: string,
  content: string,
  format: "json" | "csv",
): Promise<ImportResult> {
  const bundle =
    format === "json"
      ? parseJsonBundle(content)
      : csvRowsToBundle(parseCsvPersonRows(content));

  const supabase = await createClient();
  const refToPersonId = new Map<string, string>();
  const warnings = [...bundle.warnings];
  let skippedRows = 0;

  for (const person of bundle.persons) {
    if (!person.first_name?.trim() || !person.last_name?.trim()) {
      skippedRows += 1;
      continue;
    }

    const personId = randomUUID();
    const { error } = await supabase.from("persons").insert({
      id: personId,
      family_id: familyId,
      first_name: person.first_name.trim(),
      middle_name: emptyValue(person.middle_name),
      last_name: person.last_name.trim(),
      other_name: emptyValue(person.other_name),
      gender: parseGender(person.gender),
      birth_date: emptyValue(person.birth_date),
      death_date: emptyValue(person.death_date),
      biography: emptyValue(person.biography),
      occupation: emptyValue(person.occupation),
    });

    if (error) {
      warnings.push(`Could not import ${person.ref}: ${error.message}`);
      skippedRows += 1;
      continue;
    }

    refToPersonId.set(person.ref, personId);
  }

  const seenRelationships = new Set<string>();
  let relationshipsImported = 0;

  for (const relationship of bundle.relationships) {
    if (!STORED_RELATIONSHIP_TYPES.includes(relationship.relationship_type)) {
      warnings.push(
        `Skipped unsupported relationship type: ${relationship.relationship_type}`,
      );
      continue;
    }

    const person1Id = refToPersonId.get(relationship.person1_ref);
    const person2Id = refToPersonId.get(relationship.person2_ref);

    if (!person1Id || !person2Id) {
      warnings.push(
        `Skipped relationship ${relationship.person1_ref} -> ${relationship.person2_ref}: missing person reference.`,
      );
      continue;
    }

    const key = relationshipKey(
      relationship.person1_ref,
      relationship.person2_ref,
      relationship.relationship_type,
    );

    if (seenRelationships.has(key)) {
      continue;
    }

    seenRelationships.add(key);

    const { error } = await supabase.from("relationships").insert({
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: relationship.relationship_type,
      start_date: emptyValue(relationship.start_date),
      end_date: emptyValue(relationship.end_date),
      birth_order: relationship.birth_order,
    });

    if (error) {
      warnings.push(`Could not import relationship ${key}: ${error.message}`);
      continue;
    }

    relationshipsImported += 1;
  }

  const refToEventId = new Map<string, string>();
  let eventsImported = 0;

  for (const event of bundle.events) {
    if (!event.title?.trim() || !event.event_date?.trim()) {
      warnings.push(`Skipped event ${event.ref}: title or date is missing.`);
      continue;
    }

    const eventId = randomUUID();
    const { error } = await supabase.from("events").insert({
      id: eventId,
      family_id: familyId,
      title: event.title.trim(),
      description: emptyValue(event.description),
      event_type: event.event_type,
      event_date: event.event_date,
      location: emptyValue(event.location),
    });

    if (error) {
      warnings.push(`Could not import event ${event.ref}: ${error.message}`);
      continue;
    }

    refToEventId.set(event.ref, eventId);
    eventsImported += 1;

    const participantIds = event.participant_refs
      .map((ref) => refToPersonId.get(ref))
      .filter((id): id is string => Boolean(id));

    if (participantIds.length > 0) {
      const { error: participantError } = await supabase
        .from("event_members")
        .insert(
          participantIds.map((personId) => ({
            event_id: eventId,
            person_id: personId,
          })),
        );

      if (participantError) {
        warnings.push(
          `Imported event ${event.ref} but failed to link participants: ${participantError.message}`,
        );
      }
    }
  }

  return {
    persons: refToPersonId.size,
    relationships: relationshipsImported,
    events: eventsImported,
    skippedRows,
    warnings,
  };
}
