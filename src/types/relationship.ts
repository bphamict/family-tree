import type { Person } from "@/types/person";

export type RelationshipType =
  "parent" | "child" | "spouse" | "adoptive_parent" | "guardian";

export type StoredRelationshipType = Exclude<RelationshipType, "child">;

export type Relationship = {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: StoredRelationshipType;
  start_date: string | null;
  end_date: string | null;
  birth_order: number | null;
  created_at: string;
  updated_at: string;
};

export type RelationshipPerson = Pick<
  Person,
  | "id"
  | "first_name"
  | "middle_name"
  | "last_name"
  | "gender"
  | "birth_date"
  | "death_date"
  | "avatar_url"
  | "archived_at"
>;

export type PersonRelationshipView = {
  relationship: Relationship;
  relatedPerson: RelationshipPerson;
  displayLabelKey: string;
};

export type PersonRelationshipGroups = {
  parents: PersonRelationshipView[];
  children: PersonRelationshipView[];
  spouses: PersonRelationshipView[];
  guardians: PersonRelationshipView[];
  wards: PersonRelationshipView[];
};
