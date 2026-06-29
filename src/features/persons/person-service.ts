import { createClient } from "@/lib/supabase/server";
import type { Person, PersonSearchFilters } from "@/types/person";

const PERSON_SELECT =
  "id, family_id, branch_id, first_name, middle_name, last_name, other_name, gender, birth_date, death_date, biography, occupation, avatar_url, archived_at, created_at, updated_at";

function mapPerson(row: {
  id: string;
  family_id: string;
  branch_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  other_name: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  occupation: string | null;
  avatar_url: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}): Person {
  return {
    ...row,
    gender: row.gender as Person["gender"],
  };
}

export async function getPersonsByFamily(
  familyId: string,
  filters: PersonSearchFilters = {},
): Promise<Person[]> {
  const supabase = await createClient();

  let query = supabase
    .from("persons")
    .select(PERSON_SELECT)
    .eq("family_id", familyId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }

  if (filters.occupation) {
    query = query.ilike("occupation", `%${filters.occupation}%`);
  }

  if (filters.birthYear) {
    query = query
      .gte("birth_date", `${filters.birthYear}-01-01`)
      .lte("birth_date", `${filters.birthYear}-12-31`);
  }

  if (filters.deathYear) {
    query = query
      .gte("death_date", `${filters.deathYear}-01-01`)
      .lte("death_date", `${filters.deathYear}-12-31`);
  }

  if (filters.query) {
    const search = `%${filters.query}%`;
    query = query.or(
      `first_name.ilike.${search},middle_name.ilike.${search},last_name.ilike.${search},other_name.ilike.${search}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPerson);
}

export async function getPersonById(
  familyId: string,
  personId: string,
): Promise<Person | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("persons")
    .select(PERSON_SELECT)
    .eq("family_id", familyId)
    .eq("id", personId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPerson(data) : null;
}

export async function getPersonCount(familyId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("persons")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .is("archived_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}
