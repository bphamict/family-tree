import type { KinshipPerson, KinshipRelationship } from "@/lib/kinship/types";

export type KinshipGraph = {
  persons: Map<string, KinshipPerson>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  spouses: Map<string, string[]>;
  childBirthOrders: Map<string, number>;
};

const PARENT_TYPES = new Set([
  "parent",
  "adoptive_parent",
  "guardian",
] as const);

export function buildKinshipGraph(
  persons: KinshipPerson[],
  relationships: KinshipRelationship[],
): KinshipGraph {
  const personMap = new Map(persons.map((person) => [person.id, person]));
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();
  const childBirthOrders = new Map<string, number>();

  function addToMap(map: Map<string, string[]>, key: string, value: string) {
    const existing = map.get(key) ?? [];

    if (!existing.includes(value)) {
      map.set(key, [...existing, value]);
    }
  }

  for (const relationship of relationships) {
    if (!personMap.has(relationship.person1_id)) {
      continue;
    }

    if (!personMap.has(relationship.person2_id)) {
      continue;
    }

    if (relationship.relationship_type === "spouse") {
      addToMap(spouses, relationship.person1_id, relationship.person2_id);
      addToMap(spouses, relationship.person2_id, relationship.person1_id);
      continue;
    }

    if (!PARENT_TYPES.has(relationship.relationship_type)) {
      continue;
    }

    addToMap(parents, relationship.person2_id, relationship.person1_id);
    addToMap(children, relationship.person1_id, relationship.person2_id);

    if (relationship.birth_order !== null) {
      const childId = relationship.person2_id;
      const existing = childBirthOrders.get(childId);

      if (existing === undefined || relationship.birth_order < existing) {
        childBirthOrders.set(childId, relationship.birth_order);
      }
    }
  }

  return {
    persons: personMap,
    parents,
    children,
    spouses,
    childBirthOrders,
  };
}
