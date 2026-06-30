import { getEventsByFamily } from "@/features/events/event-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { parseCsv, rowToRecord, stringifyCsv } from "@/lib/data/csv";
import { createClient } from "@/lib/supabase/server";
import type {
  CsvPersonRow,
  ExportPersonRecord,
  FamilyExportBundle,
} from "@/types/data-export";
import { FAMILY_EXPORT_VERSION } from "@/types/data-export";
import type { Person } from "@/types/person";
import type {
  Relationship,
  StoredRelationshipType,
} from "@/types/relationship";

const RELATIONSHIP_SELECT =
  "id, person1_id, person2_id, relationship_type, start_date, end_date, birth_order, created_at, updated_at";

const CSV_HEADERS = [
  "ref",
  "first_name",
  "middle_name",
  "last_name",
  "other_name",
  "gender",
  "birth_date",
  "death_date",
  "occupation",
  "biography",
  "father_ref",
  "mother_ref",
  "spouse_refs",
] as const;

function mapPersonToExport(person: Person): ExportPersonRecord {
  return {
    ref: person.id,
    first_name: person.first_name,
    middle_name: person.middle_name,
    last_name: person.last_name,
    other_name: person.other_name,
    gender: person.gender,
    birth_date: person.birth_date,
    death_date: person.death_date,
    biography: person.biography,
    occupation: person.occupation,
  };
}

function mapRelationship(row: {
  person1_id: string;
  person2_id: string;
  relationship_type: string;
  start_date: string | null;
  end_date: string | null;
  birth_order: number | null;
}): Pick<
  Relationship,
  | "person1_id"
  | "person2_id"
  | "relationship_type"
  | "start_date"
  | "end_date"
  | "birth_order"
> {
  return {
    person1_id: row.person1_id,
    person2_id: row.person2_id,
    relationship_type: row.relationship_type as StoredRelationshipType,
    start_date: row.start_date,
    end_date: row.end_date,
    birth_order: row.birth_order,
  };
}

async function getRelationshipsByFamily(
  familyId: string,
  personIds: string[],
): Promise<Relationship[]> {
  if (personIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const personIdSet = new Set(personIds);
  const { data, error } = await supabase
    .from("relationships")
    .select(RELATIONSHIP_SELECT)
    .in("person1_id", personIds);

  if (error) {
    throw error;
  }

  const seen = new Set<string>();

  return (data ?? [])
    .map(mapRelationship)
    .filter((relationship) => {
      if (
        !personIdSet.has(relationship.person1_id) ||
        !personIdSet.has(relationship.person2_id)
      ) {
        return false;
      }

      const key = [
        relationship.person1_id,
        relationship.person2_id,
        relationship.relationship_type,
      ].join(":");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((relationship) => ({
      id: "",
      created_at: "",
      updated_at: "",
      ...relationship,
    }));
}

function buildRelationshipCsvFields(
  personId: string,
  personRefById: Map<string, string>,
  relationships: Relationship[],
): Pick<CsvPersonRow, "father_ref" | "mother_ref" | "spouse_refs"> {
  const parents: string[] = [];
  const spouses: string[] = [];

  for (const relationship of relationships) {
    if (
      relationship.relationship_type === "parent" &&
      relationship.person2_id === personId
    ) {
      parents.push(relationship.person1_id);
      continue;
    }

    if (
      relationship.relationship_type === "spouse" &&
      (relationship.person1_id === personId ||
        relationship.person2_id === personId)
    ) {
      const spouseId =
        relationship.person1_id === personId
          ? relationship.person2_id
          : relationship.person1_id;
      spouses.push(spouseId);
    }
  }

  const parentRefs = parents
    .map((id) => personRefById.get(id) ?? "")
    .filter(Boolean);
  const spouseRefs = spouses
    .map((id) => personRefById.get(id) ?? "")
    .filter(Boolean);

  return {
    father_ref: parentRefs[0] ?? null,
    mother_ref: parentRefs[1] ?? null,
    spouse_refs: spouseRefs.length > 0 ? spouseRefs.join(";") : null,
  };
}

export async function buildFamilyExportBundle(
  familyId: string,
): Promise<FamilyExportBundle> {
  const family = await getFamilyById(familyId);

  if (!family) {
    throw new Error("Family not found");
  }

  const persons = await getPersonsByFamily(familyId, { includeArchived: true });
  const personIds = persons.map((person) => person.id);
  const relationships = await getRelationshipsByFamily(familyId, personIds);
  const events = await getEventsByFamily(familyId);
  const personRefById = new Map(
    persons.map((person) => [person.id, person.id]),
  );

  return {
    version: FAMILY_EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    family_name: family.name,
    persons: persons.map(mapPersonToExport),
    relationships: relationships.map((relationship) => ({
      person1_ref:
        personRefById.get(relationship.person1_id) ?? relationship.person1_id,
      person2_ref:
        personRefById.get(relationship.person2_id) ?? relationship.person2_id,
      relationship_type: relationship.relationship_type,
      start_date: relationship.start_date,
      end_date: relationship.end_date,
      birth_order: relationship.birth_order,
    })),
    events: events.map((event) => ({
      ref: event.id,
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: event.event_date,
      location: event.location,
      participant_refs: event.participants.map(
        (participant) => participant.person_id,
      ),
    })),
  };
}

export function serializeFamilyExportJson(bundle: FamilyExportBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export async function serializeFamilyExportCsv(
  familyId: string,
): Promise<string> {
  const persons = await getPersonsByFamily(familyId, { includeArchived: true });
  const personIds = persons.map((person) => person.id);
  const relationships = await getRelationshipsByFamily(familyId, personIds);
  const personRefById = new Map(
    persons.map((person) => [person.id, person.id]),
  );

  const rows = persons.map((person) => {
    const exportPerson = mapPersonToExport(person);
    const relationshipFields = buildRelationshipCsvFields(
      person.id,
      personRefById,
      relationships,
    );

    return {
      ref: exportPerson.ref,
      first_name: exportPerson.first_name,
      middle_name: exportPerson.middle_name,
      last_name: exportPerson.last_name,
      other_name: exportPerson.other_name,
      gender: exportPerson.gender,
      birth_date: exportPerson.birth_date,
      death_date: exportPerson.death_date,
      occupation: exportPerson.occupation,
      biography: exportPerson.biography,
      father_ref: relationshipFields.father_ref,
      mother_ref: relationshipFields.mother_ref,
      spouse_refs: relationshipFields.spouse_refs,
    };
  });

  return stringifyCsv([...CSV_HEADERS], rows);
}

export function parseCsvPersonRows(content: string): CsvPersonRow[] {
  const { headers, rows } = parseCsv(content);

  return rows.map((row, index) => {
    const record = rowToRecord(headers, row);

    return {
      ref: record.ref || `row-${index + 1}`,
      first_name: record.first_name ?? "",
      middle_name: record.middle_name || null,
      last_name: record.last_name ?? "",
      other_name: record.other_name || null,
      gender: (record.gender || null) as CsvPersonRow["gender"],
      birth_date: record.birth_date || null,
      death_date: record.death_date || null,
      biography: record.biography || null,
      occupation: record.occupation || null,
      father_ref: record.father_ref || null,
      mother_ref: record.mother_ref || null,
      spouse_refs: record.spouse_refs || null,
    };
  });
}

export function getCsvTemplate(): string {
  return stringifyCsv(
    [...CSV_HEADERS],
    [
      {
        ref: "p1",
        first_name: "An",
        middle_name: "Van",
        last_name: "Nguyen",
        other_name: "",
        gender: "male",
        birth_date: "1950-03-15",
        death_date: "",
        occupation: "Teacher",
        biography: "",
        father_ref: "",
        mother_ref: "",
        spouse_refs: "p2",
      },
      {
        ref: "p2",
        first_name: "Binh",
        middle_name: "",
        last_name: "Tran",
        other_name: "",
        gender: "female",
        birth_date: "1952-07-20",
        death_date: "",
        occupation: "",
        biography: "",
        father_ref: "",
        mother_ref: "",
        spouse_refs: "p1",
      },
    ],
  );
}
