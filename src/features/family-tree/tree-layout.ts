import { sortPersonIdsByBirthOrder } from "@/lib/relationship/birth-order";
import { formatPersonName } from "@/types/person";
import type { PersonGender } from "@/types/person";
import type { TreeEdge, TreeLayoutNode, TreePerson } from "@/types/tree";
import {
  TREE_HORIZONTAL_GAP,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  TREE_SPOUSE_GAP,
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
  const spousePairs = buildSpousePairs(edges);
  const parentEdges = edges.filter((edge) => isParentChildEdgeType(edge.type));

  const generationValues = [...generations.values()];
  const minGeneration = Math.min(...generationValues);
  const maxGeneration = Math.max(...generationValues);

  const rows = new Map<number, string[]>();

  for (const [personId, generation] of generations.entries()) {
    const row = rows.get(generation) ?? [];
    row.push(personId);
    rows.set(generation, row);
  }

  const topGenerationPersonIds = rows.get(minGeneration) ?? [];
  const topUnits = clusterSpouseUnits(
    topGenerationPersonIds,
    generations,
    spousePairs,
    nodeMap,
    minGeneration,
  );

  let cursorX = 0;
  const layoutNodes: TreeLayoutNode[] = [];
  const placedIds = new Set<string>();

  for (const unitMembers of topUnits) {
    const result = layoutFamilyUnit({
      primaryMemberId: unitMembers[0],
      generation: minGeneration,
      minGeneration,
      maxGeneration,
      rootPersonId,
      nodeMap,
      generations,
      spousePairs,
      parentEdges,
      edges,
      placedIds,
    });

    for (const node of result.nodes) {
      layoutNodes.push({
        ...node,
        x: node.x + cursorX,
      });
    }

    cursorX += result.width + TREE_HORIZONTAL_GAP;
  }

  if (layoutNodes.length === 0) {
    return [];
  }

  return centerLayoutNodes(layoutNodes);
}

type FamilyUnitLayoutParams = {
  primaryMemberId: string;
  generation: number;
  minGeneration: number;
  maxGeneration: number;
  rootPersonId: string;
  nodeMap: Map<string, TreePerson>;
  generations: Map<string, number>;
  spousePairs: Map<string, string[]>;
  parentEdges: TreeEdge[];
  edges: TreeEdge[];
  placedIds: Set<string>;
};

function layoutFamilyUnit({
  primaryMemberId,
  generation,
  minGeneration,
  maxGeneration,
  rootPersonId,
  nodeMap,
  generations,
  spousePairs,
  parentEdges,
  edges,
  placedIds,
}: FamilyUnitLayoutParams): { width: number; nodes: TreeLayoutNode[] } {
  const members = expandUnitMembers(
    primaryMemberId,
    generation,
    generations,
    spousePairs,
    nodeMap,
  );
  const unplacedMemberCount = members.filter(
    (memberId) => !placedIds.has(memberId),
  ).length;
  const intrinsicWidth = getUnitWidth(
    unplacedMemberCount > 0 ? members.length : 0,
  );
  const y = (generation - minGeneration) * TREE_VERTICAL_GAP;

  if (generation >= maxGeneration) {
    return {
      width: intrinsicWidth,
      nodes: placeUnitMembers(
        members,
        y,
        generation,
        rootPersonId,
        0,
        nodeMap,
        placedIds,
      ),
    };
  }

  const childIds = getDirectChildren(
    members,
    generation,
    parentEdges,
    generations,
  );
  const sortedChildIds = sortPersonIdsByBirthOrder(childIds, nodeMap, edges);

  if (sortedChildIds.length === 0) {
    return {
      width: intrinsicWidth,
      nodes: placeUnitMembers(
        members,
        y,
        generation,
        rootPersonId,
        0,
        nodeMap,
        placedIds,
      ),
    };
  }

  const childLayouts = sortedChildIds
    .filter((childId) => !placedIds.has(childId))
    .map((childId) =>
      layoutFamilyUnit({
        primaryMemberId: childId,
        generation: generation + 1,
        minGeneration,
        maxGeneration,
        rootPersonId,
        nodeMap,
        generations,
        spousePairs,
        parentEdges,
        edges,
        placedIds,
      }),
    );

  const childrenWidth =
    childLayouts.reduce((total, layout) => total + layout.width, 0) +
    Math.max(0, childLayouts.length - 1) * TREE_HORIZONTAL_GAP;
  const totalWidth = Math.max(intrinsicWidth, childrenWidth);
  const parentOffset = (totalWidth - intrinsicWidth) / 2;

  const parentNodes = placeUnitMembers(
    members,
    y,
    generation,
    rootPersonId,
    parentOffset,
    nodeMap,
    placedIds,
  );

  let childCursorX = (totalWidth - childrenWidth) / 2;
  const childNodes: TreeLayoutNode[] = [];

  for (const childLayout of childLayouts) {
    for (const node of childLayout.nodes) {
      childNodes.push({
        ...node,
        x: node.x + childCursorX,
      });
    }

    childCursorX += childLayout.width + TREE_HORIZONTAL_GAP;
  }

  return {
    width: totalWidth,
    nodes: [...parentNodes, ...childNodes],
  };
}

function placeUnitMembers(
  members: string[],
  y: number,
  generation: number,
  rootPersonId: string,
  startX: number,
  nodeMap: Map<string, TreePerson>,
  placedIds: Set<string>,
): TreeLayoutNode[] {
  const sortedMembers = sortSpousesLeftToRight(members, nodeMap).filter(
    (memberId) => !placedIds.has(memberId) && nodeMap.has(memberId),
  );
  let x = startX;
  const layoutNodes: TreeLayoutNode[] = [];

  for (const [index, memberId] of sortedMembers.entries()) {
    const person = nodeMap.get(memberId);

    if (!person) {
      continue;
    }

    placedIds.add(memberId);
    layoutNodes.push({
      person,
      x,
      y,
      generation,
      isRoot: memberId === rootPersonId,
    });

    if (index < sortedMembers.length - 1) {
      x += TREE_NODE_WIDTH + TREE_SPOUSE_GAP;
    }
  }

  return layoutNodes;
}

function getUnitWidth(memberCount: number): number {
  if (memberCount <= 0) {
    return 0;
  }

  return (
    memberCount * TREE_NODE_WIDTH +
    Math.max(0, memberCount - 1) * TREE_SPOUSE_GAP
  );
}

function expandUnitMembers(
  primaryMemberId: string,
  generation: number,
  generations: Map<string, number>,
  spousePairs: Map<string, string[]>,
  nodeMap: Map<string, TreePerson>,
): string[] {
  const members: string[] = [primaryMemberId];
  const memberSet = new Set<string>([primaryMemberId]);

  for (const spouseId of spousePairs.get(primaryMemberId) ?? []) {
    if (
      generations.get(spouseId) === generation &&
      nodeMap.has(spouseId) &&
      !memberSet.has(spouseId)
    ) {
      members.push(spouseId);
      memberSet.add(spouseId);
    }
  }

  return members;
}

function clusterSpouseUnits(
  personIds: string[],
  generations: Map<string, number>,
  spousePairs: Map<string, string[]>,
  nodeMap: Map<string, TreePerson>,
  generation: number,
): string[][] {
  const remaining = new Set(personIds);
  const units: string[][] = [];

  for (const personId of personIds) {
    if (!remaining.has(personId)) {
      continue;
    }

    const members = expandUnitMembers(
      personId,
      generation,
      generations,
      spousePairs,
      nodeMap,
    );

    for (const memberId of members) {
      remaining.delete(memberId);
    }

    units.push(members);
  }

  return units;
}

function getDirectChildren(
  parentIds: string[],
  generation: number,
  parentEdges: TreeEdge[],
  generations: Map<string, number>,
): string[] {
  const parentSet = new Set(parentIds);
  const children = new Set<string>();

  for (const edge of parentEdges) {
    if (!parentSet.has(edge.sourceId)) {
      continue;
    }

    if (generations.get(edge.targetId) !== generation + 1) {
      continue;
    }

    children.add(edge.targetId);
  }

  return [...children];
}

function centerLayoutNodes(layoutNodes: TreeLayoutNode[]): TreeLayoutNode[] {
  const minX = Math.min(...layoutNodes.map((node) => node.x));
  const maxX = Math.max(...layoutNodes.map((node) => node.x + TREE_NODE_WIDTH));
  const centerShift = -(minX + maxX) / 2;

  return layoutNodes.map((node) => ({
    ...node,
    x: node.x + centerShift,
  }));
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
          continue;
        }

        if (generations.get(spouseId) !== generation) {
          const alignedGeneration = Math.min(
            generation,
            generations.get(spouseId)!,
          );
          generations.set(personId, alignedGeneration);
          generations.set(spouseId, alignedGeneration);
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

function sortSpousesLeftToRight(
  personIds: string[],
  nodeMap: Map<string, TreePerson>,
): string[] {
  return [...personIds].sort((leftId, rightId) => {
    const left = nodeMap.get(leftId);
    const right = nodeMap.get(rightId);

    if (!left || !right) {
      return 0;
    }

    return compareSpouseLayoutOrder(left, right);
  });
}

function compareSpouseLayoutOrder(left: TreePerson, right: TreePerson): number {
  const leftRank = getSpouseLayoutRank(left.gender);
  const rightRank = getSpouseLayoutRank(right.gender);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return formatPersonName(left).localeCompare(formatPersonName(right));
}

function getSpouseLayoutRank(gender: PersonGender | null): number {
  if (gender === "male") {
    return 0;
  }

  if (gender === "female") {
    return 1;
  }

  return 2;
}

function buildSpousePairSet(edges: TreeEdge[]): Set<string> {
  const pairs = new Set<string>();

  for (const edge of edges) {
    if (edge.type !== "spouse") {
      continue;
    }

    pairs.add(getSpousePairKey(edge.sourceId, edge.targetId));
  }

  return pairs;
}

function getSpousePairKey(personAId: string, personBId: string): string {
  return [personAId, personBId].sort().join(":");
}

function areSpouses(
  personAId: string,
  personBId: string,
  spousePairs: Set<string>,
): boolean {
  return spousePairs.has(getSpousePairKey(personAId, personBId));
}

function isParentChildEdgeType(type: TreeEdge["type"]): boolean {
  return type === "parent" || type === "adoptive_parent" || type === "guardian";
}

function toRelativeNode(
  node: TreeLayoutNode,
  bounds: { minX: number; minY: number },
): TreeLayoutNode {
  return {
    ...node,
    x: node.x - bounds.minX,
    y: node.y - bounds.minY,
  };
}

export type RenderedTreeEdge = {
  id: string;
  d: string;
  type: TreeEdge["type"];
  personIds: string[];
};

export function getRenderedTreeEdges(
  edges: TreeEdge[],
  layoutNodes: TreeLayoutNode[],
  bounds: { minX: number; minY: number },
): RenderedTreeEdge[] {
  const layoutMap = new Map(layoutNodes.map((node) => [node.person.id, node]));
  const spousePairs = buildSpousePairSet(edges);
  const spouseAdjacency = buildSpousePairs(edges);
  const rendered: RenderedTreeEdge[] = [];

  for (const edge of edges) {
    if (edge.type !== "spouse") {
      continue;
    }

    const source = layoutMap.get(edge.sourceId);
    const target = layoutMap.get(edge.targetId);

    if (!source || !target) {
      continue;
    }

    rendered.push({
      id: edge.id,
      type: edge.type,
      personIds: [edge.sourceId, edge.targetId],
      d: getEdgePath(
        toRelativeNode(source, bounds),
        toRelativeNode(target, bounds),
        edge.type,
      ),
    });
  }

  const parentEdges = edges.filter((edge) => {
    if (!isParentChildEdgeType(edge.type)) {
      return false;
    }

    return layoutMap.has(edge.sourceId) && layoutMap.has(edge.targetId);
  });

  const parentsByChild = new Map<string, TreeEdge[]>();

  for (const edge of parentEdges) {
    const childEdges = parentsByChild.get(edge.targetId) ?? [];
    childEdges.push(edge);
    parentsByChild.set(edge.targetId, childEdges);
  }

  const renderedParentEdgeIds = new Set<string>();

  for (const [childId, childParentEdges] of parentsByChild) {
    const child = layoutMap.get(childId);

    if (!child) {
      continue;
    }

    const parentNodes = [
      ...new Set(childParentEdges.map((edge) => edge.sourceId)),
    ]
      .map((parentId) => layoutMap.get(parentId))
      .filter((node): node is TreeLayoutNode => node !== undefined);

    const coupleParents = resolveCoupleParents(
      parentNodes,
      layoutMap,
      spousePairs,
      spouseAdjacency,
    );

    if (coupleParents) {
      const [leftParent, rightParent] = coupleParents;

      rendered.push({
        id: `couple-${leftParent.person.id}-${rightParent.person.id}-${childId}`,
        type: "parent",
        personIds: [leftParent.person.id, rightParent.person.id, childId],
        d: getCoupleToChildPath(
          toRelativeNode(leftParent, bounds),
          toRelativeNode(rightParent, bounds),
          toRelativeNode(child, bounds),
        ),
      });

      for (const edge of childParentEdges) {
        renderedParentEdgeIds.add(edge.id);
      }

      continue;
    }

    for (const edge of childParentEdges) {
      if (renderedParentEdgeIds.has(edge.id)) {
        continue;
      }

      const source = layoutMap.get(edge.sourceId);

      if (!source) {
        continue;
      }

      rendered.push({
        id: edge.id,
        type: edge.type,
        personIds: [edge.sourceId, edge.targetId],
        d: getEdgePath(
          toRelativeNode(source, bounds),
          toRelativeNode(child, bounds),
          edge.type,
        ),
      });
      renderedParentEdgeIds.add(edge.id);
    }
  }

  return rendered;
}

function resolveCoupleParents(
  parentNodes: TreeLayoutNode[],
  layoutMap: Map<string, TreeLayoutNode>,
  spousePairs: Set<string>,
  spouseAdjacency: Map<string, string[]>,
): [TreeLayoutNode, TreeLayoutNode] | null {
  const pairAmongParents = findSpouseParentPair(parentNodes, spousePairs);

  if (pairAmongParents) {
    return pairAmongParents;
  }

  for (const parentNode of parentNodes) {
    for (const spouseId of spouseAdjacency.get(parentNode.person.id) ?? []) {
      const spouseNode = layoutMap.get(spouseId);

      if (!spouseNode) {
        continue;
      }

      if (spouseNode.generation !== parentNode.generation) {
        continue;
      }

      return orderCoupleLeftToRight(parentNode, spouseNode);
    }
  }

  return null;
}

function orderCoupleLeftToRight(
  left: TreeLayoutNode,
  right: TreeLayoutNode,
): [TreeLayoutNode, TreeLayoutNode] {
  return left.x <= right.x ? [left, right] : [right, left];
}

function findSpouseParentPair(
  parents: TreeLayoutNode[],
  spousePairs: Set<string>,
): [TreeLayoutNode, TreeLayoutNode] | null {
  if (parents.length < 2) {
    return null;
  }

  for (let index = 0; index < parents.length; index += 1) {
    for (
      let otherIndex = index + 1;
      otherIndex < parents.length;
      otherIndex += 1
    ) {
      const leftParent = parents[index];
      const rightParent = parents[otherIndex];

      if (
        areSpouses(leftParent.person.id, rightParent.person.id, spousePairs)
      ) {
        return orderCoupleLeftToRight(leftParent, rightParent);
      }
    }
  }

  return null;
}

function getCoupleToChildPath(
  leftParent: TreeLayoutNode,
  rightParent: TreeLayoutNode,
  child: TreeLayoutNode,
): string {
  const leftCenterX = leftParent.x + TREE_NODE_WIDTH / 2;
  const rightCenterX = rightParent.x + TREE_NODE_WIDTH / 2;
  const spouseLineY = leftParent.y + TREE_NODE_HEIGHT / 2;
  const junctionX = (leftCenterX + rightCenterX) / 2;
  const parentBottomY = leftParent.y + TREE_NODE_HEIGHT;
  const childTopY = child.y;
  const childCenterX = child.x + TREE_NODE_WIDTH / 2;
  const midY = (parentBottomY + childTopY) / 2;

  return `M ${junctionX} ${spouseLineY} L ${junctionX} ${parentBottomY} L ${junctionX} ${midY} L ${childCenterX} ${midY} L ${childCenterX} ${childTopY}`;
}

export function getEdgePath(
  source: TreeLayoutNode,
  target: TreeLayoutNode,
  type: TreeEdge["type"],
): string {
  const sourceX = source.x + TREE_NODE_WIDTH / 2;
  const sourceY = source.y + TREE_NODE_HEIGHT / 2;
  const targetX = target.x + TREE_NODE_WIDTH / 2;

  if (type === "spouse") {
    const y = sourceY;
    return `M ${sourceX} ${y} L ${targetX} ${y}`;
  }

  const sourceBottomY = source.y + TREE_NODE_HEIGHT;
  const targetTopY = target.y;
  const midY = (sourceBottomY + targetTopY) / 2;

  return `M ${sourceX} ${sourceBottomY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetTopY}`;
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
  const maxX = Math.max(...layoutNodes.map((node) => node.x + TREE_NODE_WIDTH));
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
