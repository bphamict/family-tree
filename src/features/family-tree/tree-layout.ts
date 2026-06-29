import type { TreeEdge, TreeLayoutNode, TreePerson } from "@/types/tree";
import {
  TREE_HORIZONTAL_GAP,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  TREE_VERTICAL_GAP,
} from "@/types/tree";

export function layoutTree(
  rootPersonId: string,
  nodes: TreePerson[],
  edges: TreeEdge[],
): TreeLayoutNode[] {
  if (nodes.length === 0) {
    return [];
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const generations = assignGenerations(rootPersonId, nodeMap, edges);
  const rows = new Map<number, string[]>();

  for (const [personId, generation] of generations.entries()) {
    const row = rows.get(generation) ?? [];
    row.push(personId);
    rows.set(generation, row);
  }

  const sortedGenerations = [...rows.keys()].sort((a, b) => a - b);
  const layoutNodes: TreeLayoutNode[] = [];

  for (const generation of sortedGenerations) {
    const personIds = rows.get(generation) ?? [];
    const positionedIds = orderRowWithSpouses(personIds, edges);
    const rowWidth =
      positionedIds.length * TREE_NODE_WIDTH +
      Math.max(0, positionedIds.length - 1) * TREE_HORIZONTAL_GAP;
    let x = -rowWidth / 2;

    for (const personId of positionedIds) {
      const person = nodeMap.get(personId);

      if (!person) {
        continue;
      }

      layoutNodes.push({
        person,
        x,
        y: generation * TREE_VERTICAL_GAP,
        generation,
        isRoot: personId === rootPersonId,
      });

      x += TREE_NODE_WIDTH + TREE_HORIZONTAL_GAP;
    }
  }

  return layoutNodes;
}

function assignGenerations(
  rootPersonId: string,
  nodeMap: Map<string, TreePerson>,
  edges: TreeEdge[],
): Map<string, number> {
  const generations = new Map<string, number>([[rootPersonId, 0]]);
  const parentEdges = edges.filter(
    (edge) =>
      edge.type === "parent" ||
      edge.type === "adoptive_parent" ||
      edge.type === "guardian",
  );
  const spousePairs = buildSpousePairs(edges);

  let changed = true;

  while (changed) {
    changed = false;

    for (const edge of parentEdges) {
      const parentGeneration = generations.get(edge.sourceId);
      const childGeneration = generations.get(edge.targetId);

      if (parentGeneration !== undefined && childGeneration === undefined) {
        generations.set(edge.targetId, parentGeneration + 1);
        changed = true;
      }

      if (childGeneration !== undefined && parentGeneration === undefined) {
        generations.set(edge.sourceId, childGeneration - 1);
        changed = true;
      }
    }

    for (const [personId, generation] of generations.entries()) {
      const spouses = spousePairs.get(personId) ?? [];

      for (const spouseId of spouses) {
        if (!nodeMap.has(spouseId)) {
          continue;
        }

        if (!generations.has(spouseId)) {
          generations.set(spouseId, generation);
          changed = true;
        }
      }
    }
  }

  for (const personId of nodeMap.keys()) {
    if (!generations.has(personId)) {
      generations.set(personId, 0);
    }
  }

  return generations;
}

function buildSpousePairs(edges: TreeEdge[]): Map<string, string[]> {
  const pairs = new Map<string, string[]>();

  for (const edge of edges) {
    if (edge.type !== "spouse") {
      continue;
    }

    const left = pairs.get(edge.sourceId) ?? [];
    left.push(edge.targetId);
    pairs.set(edge.sourceId, left);

    const right = pairs.get(edge.targetId) ?? [];
    right.push(edge.sourceId);
    pairs.set(edge.targetId, right);
  }

  return pairs;
}

function orderRowWithSpouses(personIds: string[], edges: TreeEdge[]): string[] {
  const spousePairs = buildSpousePairs(edges);
  const remaining = new Set(personIds);
  const ordered: string[] = [];

  for (const personId of personIds) {
    if (!remaining.has(personId)) {
      continue;
    }

    ordered.push(personId);
    remaining.delete(personId);

    const spouses = (spousePairs.get(personId) ?? []).filter((spouseId) =>
      remaining.has(spouseId),
    );

    for (const spouseId of spouses) {
      ordered.push(spouseId);
      remaining.delete(spouseId);
    }
  }

  return ordered;
}

export function getEdgePath(
  source: TreeLayoutNode,
  target: TreeLayoutNode,
  type: TreeEdge["type"],
): string {
  const sourceX = source.x + TREE_NODE_WIDTH / 2;
  const sourceY = source.y + TREE_NODE_HEIGHT / 2;
  const targetX = target.x + TREE_NODE_WIDTH / 2;
  const targetY = target.y + TREE_NODE_HEIGHT / 2;

  if (type === "spouse") {
    const y = sourceY;
    return `M ${sourceX} ${y} L ${targetX} ${y}`;
  }

  const midY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`;
}

export function getCanvasBounds(layoutNodes: TreeLayoutNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (layoutNodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...layoutNodes.map((node) => node.x));
  const maxX = Math.max(
    ...layoutNodes.map((node) => node.x + TREE_NODE_WIDTH),
  );
  const minY = Math.min(...layoutNodes.map((node) => node.y));
  const maxY = Math.max(
    ...layoutNodes.map((node) => node.y + TREE_NODE_HEIGHT),
  );

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
