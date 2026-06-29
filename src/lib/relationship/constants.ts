import type { RelationshipType } from "@/types/relationship";

export type CreateRelationshipType =
  | RelationshipType
  | "adopted_child";

export const CREATE_RELATIONSHIP_TYPES: CreateRelationshipType[] = [
  "parent",
  "child",
  "spouse",
  "adoptive_parent",
  "adopted_child",
  "guardian",
];

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  "parent",
  "child",
  "spouse",
  "adoptive_parent",
  "guardian",
];

export const RELATIONSHIP_TYPE_LABELS: Record<CreateRelationshipType, string> = {
  parent: "Parent of this person",
  child: "Child of this person",
  spouse: "Spouse",
  adoptive_parent: "Adoptive parent of this person",
  adopted_child: "Adopted child of this person",
  guardian: "Guardian of this person",
};

export const RELATIONSHIP_GROUP_LABELS = {
  parents: "Parents",
  children: "Children",
  spouses: "Spouses",
  guardians: "Guardians",
  wards: "Wards",
} as const;
