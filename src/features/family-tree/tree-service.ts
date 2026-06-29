import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/types/person";
import type { TreeEdge, TreePerson, TreeSubgraph } from "@/types/tree";
import type { StoredRelationshipType } from "@/types/relationship";

const PERSON_SELECT =
  "id, first_name, middle_name, last_name, other_name, gender, birth_date, death_date, avatar_url";

const RELATIONSHIP_SELECT =
  "id, person1_id, person2_id, relationship_type, birth_order";

type NeighborResult = {
  parents: TreePerson[];
  children: TreePerson[];
  spouses: TreePerson[];
  edges: TreeEdge[];
};

function mapPerson(row: Record<string, unknown>): TreePerson {
  return row as TreePerson;
}

function createEdge(
  id: string,
  sourceId: string,
  targetId: string,
  type: StoredRelationshipType,
  birthOrder: number | null = null,
): TreeEdge {
  return { id, sourceId, targetId, type, birthOrder };
}

export async function getPersonTreeNeighbors(
  personId: string,
): Promise<NeighborResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("relationships")
    .select(
      `${RELATIONSHIP_SELECT}, person1:persons!relationships_person1_id_fkey(${PERSON_SELECT}), person2:persons!relationships_person2_id_fkey(${PERSON_SELECT})`,
    )
    .or(`person1_id.eq.${personId},person2_id.eq.${personId}`);

  if (error) {
    throw error;
  }

  const parents: TreePerson[] = [];
  const children: TreePerson[] = [];
  const spouses: TreePerson[] = [];
  const edges: TreeEdge[] = [];

  for (const row of data ?? []) {
    const relationshipType = row.relationship_type as StoredRelationshipType;
    const birthOrder = (row.birth_order as number | null) ?? null;
    const person1 = row.person1 as TreePerson | null;
    const person2 = row.person2 as TreePerson | null;

    if (!person1 || !person2) {
      continue;
    }

    if (relationshipType === "spouse") {
      const spouse = person1.id === personId ? person2 : person1;
      spouses.push(spouse);
      edges.push(
        createEdge(
          row.id,
          person1.id,
          person2.id,
          relationshipType,
          birthOrder,
        ),
      );
      continue;
    }

    if (
      relationshipType === "parent" ||
      relationshipType === "adoptive_parent"
    ) {
      if (row.person2_id === personId) {
        parents.push(person1);
        edges.push(
          createEdge(
            row.id,
            person1.id,
            person2.id,
            relationshipType,
            birthOrder,
          ),
        );
      } else if (row.person1_id === personId) {
        children.push(person2);
        edges.push(
          createEdge(
            row.id,
            person1.id,
            person2.id,
            relationshipType,
            birthOrder,
          ),
        );
      }
      continue;
    }

    if (relationshipType === "guardian") {
      if (row.person2_id === personId) {
        parents.push(person1);
        edges.push(
          createEdge(
            row.id,
            person1.id,
            person2.id,
            relationshipType,
            birthOrder,
          ),
        );
      } else if (row.person1_id === personId) {
        children.push(person2);
        edges.push(
          createEdge(
            row.id,
            person1.id,
            person2.id,
            relationshipType,
            birthOrder,
          ),
        );
      }
    }
  }

  return {
    parents: dedupePersons(parents),
    children: dedupePersons(children),
    spouses: dedupePersons(spouses),
    edges: dedupeEdges(edges),
  };
}

export async function getTreeSubgraph(
  rootPersonId: string,
  ancestorDepth: number,
  descendantDepth: number,
): Promise<TreeSubgraph> {
  const supabase = await createClient();

  const { data: rootPerson, error: rootError } = await supabase
    .from("persons")
    .select(PERSON_SELECT)
    .eq("id", rootPersonId)
    .is("archived_at", null)
    .maybeSingle();

  if (rootError) {
    throw rootError;
  }

  if (!rootPerson) {
    return {
      rootPersonId,
      nodes: [],
      edges: [],
      hasMoreAncestors: false,
      hasMoreDescendants: false,
    };
  }

  const nodeMap = new Map<string, TreePerson>([
    [rootPerson.id, mapPerson(rootPerson)],
  ]);
  const edgeMap = new Map<string, TreeEdge>();
  let hasMoreAncestors = false;
  let hasMoreDescendants = false;

  await traverseDirection({
    startIds: [rootPersonId],
    depth: ancestorDepth,
    direction: "ancestors",
    nodeMap,
    edgeMap,
    onDepthLimit: () => {
      hasMoreAncestors = true;
    },
  });

  await traverseDirection({
    startIds: [rootPersonId],
    depth: descendantDepth,
    direction: "descendants",
    nodeMap,
    edgeMap,
    onDepthLimit: () => {
      hasMoreDescendants = true;
    },
  });

  for (const personId of [...nodeMap.keys()]) {
    const neighbors = await getPersonTreeNeighbors(personId);

    for (const spouse of neighbors.spouses) {
      nodeMap.set(spouse.id, spouse);
    }

    for (const edge of neighbors.edges) {
      if (edge.type === "spouse") {
        edgeMap.set(edge.id, edge);
      }
    }
  }

  return {
    rootPersonId,
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
    hasMoreAncestors,
    hasMoreDescendants,
  };
}

export async function getPersonsForTree(familyId: string): Promise<Person[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("persons")
    .select(
      "id, family_id, branch_id, first_name, middle_name, last_name, other_name, gender, birth_date, death_date, biography, occupation, avatar_url, archived_at, created_at, updated_at",
    )
    .eq("family_id", familyId)
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

async function traverseDirection({
  startIds,
  depth,
  direction,
  nodeMap,
  edgeMap,
  onDepthLimit,
}: {
  startIds: string[];
  depth: number;
  direction: "ancestors" | "descendants";
  nodeMap: Map<string, TreePerson>;
  edgeMap: Map<string, TreeEdge>;
  onDepthLimit: () => void;
}): Promise<void> {
  let frontier = startIds;
  let currentDepth = 0;

  while (frontier.length > 0 && currentDepth < depth) {
    const nextFrontier: string[] = [];

    for (const personId of frontier) {
      const neighbors = await getPersonTreeNeighbors(personId);
      const related =
        direction === "ancestors" ? neighbors.parents : neighbors.children;

      for (const person of related) {
        nodeMap.set(person.id, person);
        nextFrontier.push(person.id);
      }

      for (const edge of neighbors.edges) {
        if (edge.type === "spouse") {
          continue;
        }

        const isAncestorEdge =
          edge.type === "parent" ||
          edge.type === "adoptive_parent" ||
          edge.type === "guardian";

        if (
          direction === "ancestors" &&
          isAncestorEdge &&
          edge.targetId === personId
        ) {
          edgeMap.set(edge.id, edge);
        }

        if (
          direction === "descendants" &&
          isAncestorEdge &&
          edge.sourceId === personId
        ) {
          edgeMap.set(edge.id, edge);
        }
      }
    }

    currentDepth += 1;
    frontier = [...new Set(nextFrontier)];
  }

  if (frontier.length > 0 && currentDepth >= depth) {
    for (const personId of frontier) {
      const neighbors = await getPersonTreeNeighbors(personId);
      const related =
        direction === "ancestors" ? neighbors.parents : neighbors.children;

      if (related.length > 0) {
        onDepthLimit();
        break;
      }
    }
  }
}

function dedupePersons(persons: TreePerson[]): TreePerson[] {
  const map = new Map(persons.map((person) => [person.id, person]));
  return [...map.values()];
}

function dedupeEdges(edges: TreeEdge[]): TreeEdge[] {
  const map = new Map(edges.map((edge) => [edge.id, edge]));
  return [...map.values()];
}
