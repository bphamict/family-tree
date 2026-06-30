import type { PersonGender } from "@/types/person";
import type { StoredRelationshipType } from "@/types/relationship";

export type KinshipPerson = {
  readonly id: string;
  readonly gender: PersonGender | null;
  readonly birth_date: string | null;
};

export type KinshipRelationship = {
  readonly id: string;
  readonly person1_id: string;
  readonly person2_id: string;
  readonly relationship_type: StoredRelationshipType;
  readonly birth_order: number | null;
};

export type KinshipTermKey =
  | "self"
  | "father"
  | "mother"
  | "parent"
  | "child"
  | "husband"
  | "wife"
  | "spouse"
  | "older_brother"
  | "older_sister"
  | "younger_sibling"
  | "grandfather"
  | "grandmother"
  | "grandparent"
  | "grandchild"
  | "great_grandfather"
  | "great_grandmother"
  | "great_grandparent"
  | "great_grandchild"
  | "paternal_uncle_older"
  | "paternal_uncle_younger"
  | "paternal_aunt"
  | "maternal_uncle"
  | "maternal_aunt"
  | "cousin_older_male"
  | "cousin_older_female"
  | "cousin_younger"
  | "step_parent"
  | "child_in_law"
  | "sibling_in_law"
  | "elder_relative"
  | "younger_relative"
  | "unrelated"
  | "unknown";

export type KinshipLookupResult = {
  termKey: KinshipTermKey;
  reverseTermKey: KinshipTermKey | null;
  noteKey: "sameAge" | "ageUnknown" | null;
};
