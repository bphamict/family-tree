import type { KinshipGraph } from "@/lib/kinship/build-graph";
import type { KinshipLookupResult, KinshipTermKey } from "@/lib/kinship/types";

type AgeComparison = "older" | "younger" | "same" | "unknown";

type LcaResult = {
  lcaId: string;
  upSpeaker: number;
  upTarget: number;
};

export function lookupKinship(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): KinshipLookupResult {
  if (!graph.persons.has(speakerId) || !graph.persons.has(targetId)) {
    return {
      termKey: "unknown",
      reverseTermKey: null,
      noteKey: null,
    };
  }

  if (speakerId === targetId) {
    return {
      termKey: "self",
      reverseTermKey: "self",
      noteKey: null,
    };
  }

  const lca = findClosestCommonAncestor(graph, speakerId, targetId);

  if (!lca) {
    const marriageTerm = resolveMarriageTerm(graph, speakerId, targetId);

    if (marriageTerm) {
      return {
        termKey: marriageTerm,
        reverseTermKey: resolveMarriageTerm(graph, targetId, speakerId),
        noteKey: null,
      };
    }

    return {
      termKey: "unrelated",
      reverseTermKey: "unrelated",
      noteKey: null,
    };
  }

  const forward = resolveFromLca(graph, speakerId, targetId, lca);
  const reverse = resolveFromLca(graph, targetId, speakerId, {
    lcaId: lca.lcaId,
    upSpeaker: lca.upTarget,
    upTarget: lca.upSpeaker,
  });

  return {
    termKey: forward.termKey,
    reverseTermKey: reverse.termKey,
    noteKey: forward.noteKey ?? reverse.noteKey,
  };
}

function resolveFromLca(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
  lca: LcaResult,
): { termKey: KinshipTermKey; noteKey: KinshipLookupResult["noteKey"] } {
  const u = lca.upSpeaker;
  const v = lca.upTarget;

  if (u === 1 && v === 0) {
    return { termKey: resolveParentTerm(graph, targetId), noteKey: null };
  }

  if (u === 0 && v === 1) {
    return { termKey: "child", noteKey: null };
  }

  if (u === 2 && v === 0) {
    return { termKey: resolveGrandparentTerm(graph, targetId), noteKey: null };
  }

  if (u === 0 && v === 2) {
    return { termKey: "grandchild", noteKey: null };
  }

  if (u === 3 && v === 0) {
    return {
      termKey: resolveGreatGrandparentTerm(graph, targetId),
      noteKey: null,
    };
  }

  if (u === 0 && v === 3) {
    return { termKey: "great_grandchild", noteKey: null };
  }

  if (u === 1 && v === 1) {
    return resolveSameGenerationOneStep(graph, speakerId, targetId);
  }

  if (u === 2 && v === 1) {
    const linkingParentId = findLinkingParent(graph, speakerId, targetId);

    if (linkingParentId) {
      return {
        termKey: resolveUncleAuntTerm(
          graph,
          speakerId,
          linkingParentId,
          targetId,
        ),
        noteKey: null,
      };
    }

    return resolveCousinTerm(graph, speakerId, targetId, lca.lcaId);
  }

  if (u === 1 && v === 2) {
    return { termKey: "grandchild", noteKey: null };
  }

  if (u === 2 && v === 2) {
    if (shareParent(graph, speakerId, targetId)) {
      return resolveSiblingTerm(graph, speakerId, targetId);
    }

    return resolveCousinTerm(graph, speakerId, targetId, lca.lcaId);
  }

  if (v > u) {
    const gap = v - u;

    if (gap >= 4) {
      return { termKey: "younger_relative", noteKey: null };
    }

    if (gap === 3) {
      return { termKey: "great_grandchild", noteKey: null };
    }

    if (gap === 2) {
      return { termKey: "grandchild", noteKey: null };
    }

    if (gap === 1) {
      return u === 0
        ? { termKey: "child", noteKey: null }
        : { termKey: "grandchild", noteKey: null };
    }
  }

  if (u > v) {
    const gap = u - v;

    if (gap >= 4) {
      return { termKey: "elder_relative", noteKey: null };
    }

    if (gap === 3) {
      return {
        termKey: resolveGreatGrandparentTerm(graph, targetId),
        noteKey: null,
      };
    }

    if (gap === 2) {
      return {
        termKey: resolveGrandparentTerm(graph, targetId),
        noteKey: null,
      };
    }

    if (gap === 1) {
      if (u === 1) {
        return { termKey: resolveParentTerm(graph, targetId), noteKey: null };
      }

      if (u === 2) {
        return resolveCousinTerm(graph, speakerId, targetId, lca.lcaId);
      }

      return { termKey: "elder_relative", noteKey: null };
    }
  }

  if (u === v && u >= 3) {
    return resolveCousinTerm(graph, speakerId, targetId, lca.lcaId);
  }

  return { termKey: "unknown", noteKey: null };
}

function resolveSameGenerationOneStep(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): { termKey: KinshipTermKey; noteKey: KinshipLookupResult["noteKey"] } {
  const marriageTerm = resolveMarriageTerm(graph, speakerId, targetId);

  if (marriageTerm) {
    return { termKey: marriageTerm, noteKey: null };
  }

  if (shareParent(graph, speakerId, targetId)) {
    return resolveSiblingTerm(graph, speakerId, targetId);
  }

  return { termKey: "unknown", noteKey: null };
}

function resolveMarriageTerm(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): KinshipTermKey | null {
  if (areSpouses(graph, speakerId, targetId)) {
    return resolveSpouseTerm(graph, targetId);
  }

  for (const parentId of getParents(graph, speakerId)) {
    if (areSpouses(graph, parentId, targetId)) {
      return "step_parent";
    }
  }

  for (const childId of getChildren(graph, speakerId)) {
    if (areSpouses(graph, childId, targetId)) {
      return "child_in_law";
    }
  }

  for (const siblingId of getSiblings(graph, speakerId)) {
    if (areSpouses(graph, siblingId, targetId)) {
      return "sibling_in_law";
    }
  }

  for (const spouseId of graph.spouses.get(speakerId) ?? []) {
    if (getParents(graph, spouseId).includes(targetId)) {
      return resolveParentTerm(graph, targetId);
    }

    for (const spouseSiblingId of getSiblings(graph, spouseId)) {
      if (spouseSiblingId === targetId) {
        return "sibling_in_law";
      }
    }
  }

  return null;
}

function resolveParentTerm(
  graph: KinshipGraph,
  targetId: string,
): KinshipTermKey {
  const target = graph.persons.get(targetId);

  if (target?.gender === "male") {
    return "father";
  }

  if (target?.gender === "female") {
    return "mother";
  }

  return "parent";
}

function resolveGrandparentTerm(
  graph: KinshipGraph,
  targetId: string,
): KinshipTermKey {
  const target = graph.persons.get(targetId);

  if (target?.gender === "male") {
    return "grandfather";
  }

  if (target?.gender === "female") {
    return "grandmother";
  }

  return "grandparent";
}

function resolveGreatGrandparentTerm(
  graph: KinshipGraph,
  targetId: string,
): KinshipTermKey {
  const target = graph.persons.get(targetId);

  if (target?.gender === "male") {
    return "great_grandfather";
  }

  if (target?.gender === "female") {
    return "great_grandmother";
  }

  return "great_grandparent";
}

function resolveSpouseTerm(
  graph: KinshipGraph,
  targetId: string,
): KinshipTermKey {
  const target = graph.persons.get(targetId);

  if (target?.gender === "male") {
    return "husband";
  }

  if (target?.gender === "female") {
    return "wife";
  }

  return "spouse";
}

function resolveSiblingTerm(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): { termKey: KinshipTermKey; noteKey: KinshipLookupResult["noteKey"] } {
  const comparison = compareAge(graph, targetId, speakerId);
  const target = graph.persons.get(targetId);

  if (comparison === "older") {
    if (target?.gender === "female") {
      return { termKey: "older_sister", noteKey: null };
    }

    return { termKey: "older_brother", noteKey: null };
  }

  if (comparison === "younger") {
    return { termKey: "younger_sibling", noteKey: null };
  }

  if (comparison === "same") {
    return { termKey: "younger_sibling", noteKey: "sameAge" };
  }

  if (target?.gender === "female") {
    return { termKey: "older_sister", noteKey: "ageUnknown" };
  }

  if (target?.gender === "male") {
    return { termKey: "older_brother", noteKey: "ageUnknown" };
  }

  return { termKey: "younger_sibling", noteKey: "ageUnknown" };
}

function resolveCousinTerm(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
  lcaId: string,
): { termKey: KinshipTermKey; noteKey: KinshipLookupResult["noteKey"] } {
  const comparison = compareCousinSeniority(graph, targetId, speakerId, lcaId);
  const target = graph.persons.get(targetId);

  if (comparison === "older") {
    if (target?.gender === "female") {
      return { termKey: "cousin_older_female", noteKey: null };
    }

    return { termKey: "cousin_older_male", noteKey: null };
  }

  return {
    termKey: "cousin_younger",
    noteKey: comparison === "unknown" ? "ageUnknown" : null,
  };
}

function resolveUncleAuntTerm(
  graph: KinshipGraph,
  speakerId: string,
  linkingParentId: string,
  targetId: string,
): KinshipTermKey {
  const target = graph.persons.get(targetId);
  const parentLine = getParentLine(graph, speakerId, linkingParentId);

  if (parentLine === "maternal") {
    if (target?.gender === "female") {
      return resolveMaternalAuntTerm(graph, targetId, linkingParentId);
    }

    return resolveMaternalUncleTerm(graph, targetId, linkingParentId);
  }

  if (target?.gender === "female") {
    return resolvePaternalAuntTerm(graph, targetId, linkingParentId);
  }

  return resolvePaternalUncleTerm(graph, targetId, linkingParentId);
}

function getParentLine(
  graph: KinshipGraph,
  speakerId: string,
  linkingParentId: string,
): "paternal" | "maternal" {
  const fatherId = getFatherId(graph, speakerId);
  const motherId = getMotherId(graph, speakerId);

  if (linkingParentId === fatherId) {
    return "paternal";
  }

  if (linkingParentId === motherId) {
    return "maternal";
  }

  const linkingParent = graph.persons.get(linkingParentId);

  if (linkingParent?.gender === "male") {
    return "paternal";
  }

  if (linkingParent?.gender === "female") {
    return "maternal";
  }

  return "paternal";
}

function isOlderSiblingOfParent(
  graph: KinshipGraph,
  siblingId: string,
  parentId: string,
): boolean {
  const comparison = compareBirthOrderRelativeToParent(
    graph,
    siblingId,
    parentId,
  );

  return comparison === "older";
}

function compareBirthOrderRelativeToParent(
  graph: KinshipGraph,
  siblingId: string,
  parentId: string,
): AgeComparison {
  const siblingOrder = graph.childBirthOrders.get(siblingId) ?? null;
  const parentOrder = graph.childBirthOrders.get(parentId) ?? null;

  if (siblingOrder !== null && parentOrder !== null) {
    if (siblingOrder < parentOrder) {
      return "older";
    }

    if (siblingOrder > parentOrder) {
      return "younger";
    }

    return "same";
  }

  return compareBirthDates(graph, siblingId, parentId);
}

function resolvePaternalAuntTerm(
  graph: KinshipGraph,
  auntId: string,
  parentId: string,
): KinshipTermKey {
  if (isOlderSiblingOfParent(graph, auntId, parentId)) {
    return "paternal_uncle_older";
  }

  return "paternal_aunt";
}

function resolvePaternalUncleTerm(
  graph: KinshipGraph,
  uncleId: string,
  parentId: string,
): KinshipTermKey {
  if (isOlderSiblingOfParent(graph, uncleId, parentId)) {
    return "paternal_uncle_older";
  }

  return "paternal_uncle_younger";
}

function resolveMaternalUncleTerm(
  graph: KinshipGraph,
  uncleId: string,
  parentId: string,
): KinshipTermKey {
  if (isOlderSiblingOfParent(graph, uncleId, parentId)) {
    return "paternal_uncle_older";
  }

  return "maternal_uncle";
}

function resolveMaternalAuntTerm(
  graph: KinshipGraph,
  auntId: string,
  parentId: string,
): KinshipTermKey {
  if (isOlderSiblingOfParent(graph, auntId, parentId)) {
    return "paternal_uncle_older";
  }

  return "maternal_aunt";
}

function findClosestCommonAncestor(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): LcaResult | null {
  const speakerAncestors = getAncestorDepths(graph, speakerId);
  const targetAncestors = getAncestorDepths(graph, targetId);
  let best: LcaResult | null = null;

  for (const [ancestorId, speakerDepth] of speakerAncestors) {
    const targetDepth = targetAncestors.get(ancestorId);

    if (targetDepth === undefined) {
      continue;
    }

    const total = speakerDepth + targetDepth;

    if (!best || total < best.upSpeaker + best.upTarget) {
      best = {
        lcaId: ancestorId,
        upSpeaker: speakerDepth,
        upTarget: targetDepth,
      };
    }
  }

  return best;
}

function getAncestorDepths(
  graph: KinshipGraph,
  personId: string,
): Map<string, number> {
  const depths = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: personId, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    if (depths.has(current.id)) {
      continue;
    }

    depths.set(current.id, current.depth);

    for (const parentId of getParents(graph, current.id)) {
      if (!depths.has(parentId)) {
        queue.push({ id: parentId, depth: current.depth + 1 });
      }
    }
  }

  return depths;
}

function findLinkingParent(
  graph: KinshipGraph,
  speakerId: string,
  targetId: string,
): string | null {
  for (const parentId of getParents(graph, speakerId)) {
    if (getSiblings(graph, parentId).includes(targetId)) {
      return parentId;
    }
  }

  return null;
}

function getParents(graph: KinshipGraph, personId: string): string[] {
  return graph.parents.get(personId) ?? [];
}

function getChildren(graph: KinshipGraph, personId: string): string[] {
  return graph.children.get(personId) ?? [];
}

function getSiblings(graph: KinshipGraph, personId: string): string[] {
  const siblings = new Set<string>();

  for (const parentId of getParents(graph, personId)) {
    for (const childId of getChildren(graph, parentId)) {
      if (childId !== personId) {
        siblings.add(childId);
      }
    }
  }

  return [...siblings];
}

function shareParent(
  graph: KinshipGraph,
  personA: string,
  personB: string,
): boolean {
  const parentsA = new Set(getParents(graph, personA));

  return getParents(graph, personB).some((parentId) => parentsA.has(parentId));
}

function areSpouses(
  graph: KinshipGraph,
  personA: string,
  personB: string,
): boolean {
  return (graph.spouses.get(personA) ?? []).includes(personB);
}

function getFatherId(graph: KinshipGraph, personId: string): string | null {
  for (const parentId of getParents(graph, personId)) {
    const parent = graph.persons.get(parentId);

    if (parent?.gender === "male") {
      return parentId;
    }
  }

  return getParents(graph, personId)[0] ?? null;
}

function getMotherId(graph: KinshipGraph, personId: string): string | null {
  for (const parentId of getParents(graph, personId)) {
    const parent = graph.persons.get(parentId);

    if (parent?.gender === "female") {
      return parentId;
    }
  }

  const parents = getParents(graph, personId);

  return parents.length > 1 ? parents[1] : null;
}

function compareAge(
  graph: KinshipGraph,
  leftId: string,
  rightId: string,
): AgeComparison {
  if (shareParent(graph, leftId, rightId)) {
    const orderComparison = compareByBirthOrder(graph, leftId, rightId);

    if (orderComparison !== "unknown") {
      return orderComparison;
    }
  }

  return compareBirthDates(graph, leftId, rightId);
}

function compareCousinSeniority(
  graph: KinshipGraph,
  leftId: string,
  rightId: string,
  lcaId: string,
): AgeComparison {
  const leftParentBranch = getDirectChildOfLcaOnPath(graph, leftId, lcaId);
  const rightParentBranch = getDirectChildOfLcaOnPath(graph, rightId, lcaId);

  if (leftParentBranch && rightParentBranch) {
    const parentComparison = compareByBirthOrder(
      graph,
      leftParentBranch,
      rightParentBranch,
    );

    if (parentComparison !== "unknown") {
      return parentComparison;
    }

    const parentDateComparison = compareBirthDates(
      graph,
      leftParentBranch,
      rightParentBranch,
    );

    if (parentDateComparison !== "unknown") {
      return parentDateComparison;
    }
  }

  return compareBirthDates(graph, leftId, rightId);
}

function getDirectChildOfLcaOnPath(
  graph: KinshipGraph,
  personId: string,
  lcaId: string,
): string | null {
  for (const childId of getChildren(graph, lcaId)) {
    if (isAncestorOf(graph, childId, personId)) {
      return childId;
    }
  }

  return null;
}

function isAncestorOf(
  graph: KinshipGraph,
  ancestorId: string,
  personId: string,
): boolean {
  return getAncestorDepths(graph, personId).has(ancestorId);
}

function compareByBirthOrder(
  graph: KinshipGraph,
  leftId: string,
  rightId: string,
): AgeComparison {
  const leftOrder = graph.childBirthOrders.get(leftId) ?? null;
  const rightOrder = graph.childBirthOrders.get(rightId) ?? null;

  if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) {
    return leftOrder < rightOrder ? "older" : "younger";
  }

  if (leftOrder !== null && rightOrder === null) {
    return "older";
  }

  if (leftOrder === null && rightOrder !== null) {
    return "younger";
  }

  return "unknown";
}

function compareBirthDates(
  graph: KinshipGraph,
  leftId: string,
  rightId: string,
): AgeComparison {
  const left = graph.persons.get(leftId);
  const right = graph.persons.get(rightId);

  if (!left || !right || !left.birth_date || !right.birth_date) {
    return "unknown";
  }

  if (left.birth_date < right.birth_date) {
    return "older";
  }

  if (left.birth_date > right.birth_date) {
    return "younger";
  }

  return "same";
}
