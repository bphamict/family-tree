import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship/constants";
import type {
  PersonRelationshipGroups,
  PersonRelationshipView,
  Relationship,
  RelationshipPerson,
} from "@/types/relationship";

function mapPerson(row: RelationshipPerson): RelationshipPerson {
  return row;
}

export function groupRelationshipsForPerson(
  personId: string,
  relationships: Array<{
    relationship: Relationship;
    person1: RelationshipPerson | null;
    person2: RelationshipPerson | null;
  }>,
): PersonRelationshipGroups {
  const groups: PersonRelationshipGroups = {
    parents: [],
    children: [],
    spouses: [],
    guardians: [],
    wards: [],
  };

  for (const entry of relationships) {
    const view = toRelationshipView(personId, entry);

    if (!view) {
      continue;
    }

    if (
      groups[view.group].some(
        (item) => item.relationship.id === view.item.relationship.id,
      )
    ) {
      continue;
    }

    groups[view.group].push(view.item);
  }

  return groups;
}

function toRelationshipView(
  personId: string,
  entry: {
    relationship: Relationship;
    person1: RelationshipPerson | null;
    person2: RelationshipPerson | null;
  },
): { group: keyof PersonRelationshipGroups; item: PersonRelationshipView } | null {
  const { relationship, person1, person2 } = entry;

  if (!person1 || !person2) {
    return null;
  }

  if (relationship.relationship_type === "spouse") {
    const relatedPerson =
      relationship.person1_id === personId ? mapPerson(person2) : mapPerson(person1);

    return {
      group: "spouses",
      item: {
        relationship,
        relatedPerson,
        displayLabel: RELATIONSHIP_TYPE_LABELS.spouse,
      },
    };
  }

  if (
    relationship.relationship_type === "parent" ||
    relationship.relationship_type === "adoptive_parent"
  ) {
    if (relationship.person2_id === personId) {
      return {
        group: "parents",
        item: {
          relationship,
          relatedPerson: mapPerson(person1),
          displayLabel: RELATIONSHIP_TYPE_LABELS[relationship.relationship_type],
        },
      };
    }

    if (relationship.person1_id === personId) {
      return {
        group: "children",
        item: {
          relationship,
          relatedPerson: mapPerson(person2),
          displayLabel:
            relationship.relationship_type === "adoptive_parent"
              ? "Adopted child"
              : "Child",
        },
      };
    }
  }

  if (relationship.relationship_type === "guardian") {
    if (relationship.person2_id === personId) {
      return {
        group: "guardians",
        item: {
          relationship,
          relatedPerson: mapPerson(person1),
          displayLabel: RELATIONSHIP_TYPE_LABELS.guardian,
        },
      };
    }

    if (relationship.person1_id === personId) {
      return {
        group: "wards",
        item: {
          relationship,
          relatedPerson: mapPerson(person2),
          displayLabel: "Ward",
        },
      };
    }
  }

  return null;
}
