import { groupRelationshipsForPerson } from "@/lib/relationship/group-relationships";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/types/person";
import type {
  PersonRelationshipGroups,
  Relationship,
  RelationshipPerson,
  StoredRelationshipType,
} from "@/types/relationship";

const RELATIONSHIP_SELECT =
  "id, person1_id, person2_id, relationship_type, start_date, end_date, created_at, updated_at";

const PERSON_SELECT =
  "id, first_name, middle_name, last_name, gender, birth_date, death_date, avatar_url, archived_at";

function mapRelationship(row: {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}): Relationship {
  return {
    ...row,
    relationship_type: row.relationship_type as StoredRelationshipType,
  };
}

export async function getRelationshipsForPerson(
  familyId: string,
  personId: string,
): Promise<PersonRelationshipGroups> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("relationships")
    .select(
      `${RELATIONSHIP_SELECT}, person1:persons!relationships_person1_id_fkey(${PERSON_SELECT}), person2:persons!relationships_person2_id_fkey(${PERSON_SELECT})`,
    )
    .or(`person1_id.eq.${personId},person2_id.eq.${personId}`)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const entries = (data ?? [])
    .map((row) => ({
      relationship: mapRelationship(row),
      person1: row.person1 as RelationshipPerson | null,
      person2: row.person2 as RelationshipPerson | null,
    }))
    .filter((entry) => {
      const person = entry.person1 ?? entry.person2;
      return person !== null;
    });

  return groupRelationshipsForPerson(personId, entries);
}

export async function getPersonOptionsForRelationships(
  familyId: string,
  excludePersonId: string,
): Promise<Person[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("persons")
    .select(
      "id, family_id, branch_id, first_name, middle_name, last_name, gender, birth_date, death_date, biography, occupation, avatar_url, archived_at, created_at, updated_at",
    )
    .eq("family_id", familyId)
    .neq("id", excludePersonId)
    .is("archived_at", null)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    gender: row.gender as Person["gender"],
  }));
}
