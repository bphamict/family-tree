import { formatPersonName } from "@/types/person";
import type { PersonRelationshipView } from "@/types/relationship";
import type { TreeEdge, TreePerson } from "@/types/tree";

const PARENT_EDGE_TYPES: ReadonlyArray<TreeEdge["type"]> = [
  "parent",
  "adoptive_parent",
  "guardian",
];

export function isParentChildEdge(type: TreeEdge["type"]): boolean {
  return PARENT_EDGE_TYPES.includes(type);
}

export function getBirthOrderForChild(
  childId: string,
  edges: Array<Pick<TreeEdge, "sourceId" | "targetId" | "type" | "birthOrder">>,
): number | null {
  const orders = edges
    .filter((edge) => edge.targetId === childId && isParentChildEdge(edge.type))
    .map((edge) => edge.birthOrder)
    .filter((order): order is number => order !== null && order !== undefined);

  if (orders.length === 0) {
    return null;
  }

  return Math.min(...orders);
}

export function compareByBirthOrder<
  T extends Pick<
    TreePerson,
    "id" | "birth_date" | "first_name" | "middle_name" | "last_name"
  >,
>(
  personA: T,
  personB: T,
  edges: Array<Pick<TreeEdge, "sourceId" | "targetId" | "type" | "birthOrder">>,
): number {
  const orderA = getBirthOrderForChild(personA.id, edges);
  const orderB = getBirthOrderForChild(personB.id, edges);

  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB;
  }

  if (orderA !== null && orderB === null) {
    return -1;
  }

  if (orderA === null && orderB !== null) {
    return 1;
  }

  if (
    personA.birth_date &&
    personB.birth_date &&
    personA.birth_date !== personB.birth_date
  ) {
    return personA.birth_date.localeCompare(personB.birth_date);
  }

  if (personA.birth_date && !personB.birth_date) {
    return -1;
  }

  if (!personA.birth_date && personB.birth_date) {
    return 1;
  }

  return formatPersonName(personA).localeCompare(formatPersonName(personB));
}

export function sortPersonIdsByBirthOrder(
  personIds: string[],
  nodeMap: Map<string, TreePerson>,
  edges: TreeEdge[],
): string[] {
  return [...personIds].sort((leftId, rightId) => {
    const left = nodeMap.get(leftId);
    const right = nodeMap.get(rightId);

    if (!left || !right) {
      return 0;
    }

    return compareByBirthOrder(left, right, edges);
  });
}

export function sortChildRelationships(
  items: PersonRelationshipView[],
): PersonRelationshipView[] {
  return [...items].sort((left, right) => {
    const orderA = left.relationship.birth_order;
    const orderB = right.relationship.birth_order;

    if (orderA !== null && orderB !== null && orderA !== orderB) {
      return orderA - orderB;
    }

    if (orderA !== null && orderB === null) {
      return -1;
    }

    if (orderA === null && orderB !== null) {
      return 1;
    }

    return compareByBirthOrder(left.relatedPerson, right.relatedPerson, []);
  });
}
