import { createClient } from "@/lib/supabase/server";
import type { KinshipPerson, KinshipRelationship } from "@/lib/kinship/types";
import type { Person } from "@/types/person";
import type { StoredRelationshipType } from "@/types/relationship";
import { getPersonsForTree } from "@/features/family-tree/tree-service";

const RELATIONSHIP_SELECT =
  "id, person1_id, person2_id, relationship_type, birth_order";

export type KinshipLookupData = {
  persons: Person[];
  kinshipPersons: KinshipPerson[];
  relationships: KinshipRelationship[];
};

export async function getKinshipLookupData(
  familyId: string,
): Promise<KinshipLookupData> {
  const persons = await getPersonsForTree(familyId);
  const relationships = await getFamilyRelationships(persons);
  const kinshipPersons: KinshipPerson[] = persons.map((person) => ({
    id: person.id,
    gender: person.gender,
    birth_date: person.birth_date,
  }));

  return {
    persons,
    kinshipPersons,
    relationships,
  };
}

async function getFamilyRelationships(
  persons: Person[],
): Promise<KinshipRelationship[]> {
  const personIds = persons.map((person) => person.id);

  if (personIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("relationships")
    .select(RELATIONSHIP_SELECT)
    .or(
      `person1_id.in.(${personIds.join(",")}),person2_id.in.(${personIds.join(",")})`,
    );

  if (error) {
    throw error;
  }

  const personIdSet = new Set(personIds);

  return (data ?? [])
    .filter(
      (row) =>
        personIdSet.has(row.person1_id) && personIdSet.has(row.person2_id),
    )
    .map((row) => ({
      id: row.id,
      person1_id: row.person1_id,
      person2_id: row.person2_id,
      relationship_type: row.relationship_type as StoredRelationshipType,
      birth_order: row.birth_order,
    }));
}
