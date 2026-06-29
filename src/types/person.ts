export type PersonGender = "male" | "female" | "other" | "unknown";

export type Person = {
  id: string;
  family_id: string;
  branch_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: PersonGender | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  occupation: string | null;
  avatar_url: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonSearchFilters = {
  query?: string;
  gender?: PersonGender;
  birthYear?: string;
  deathYear?: string;
  occupation?: string;
  includeArchived?: boolean;
};

export function formatPersonName(person: Pick<Person, "first_name" | "middle_name" | "last_name">): string {
  return [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(" ");
}
