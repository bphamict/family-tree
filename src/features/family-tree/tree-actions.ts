"use server";

import { getFamilyById } from "@/features/families/family-service";
import {
  getTreeSubgraph,
} from "@/features/family-tree/tree-service";
import { requireUser } from "@/lib/auth/require-user";
import { canViewPersons } from "@/lib/family/permissions";
import {
  DEFAULT_ANCESTOR_DEPTH,
  DEFAULT_DESCENDANT_DEPTH,
  MAX_TREE_DEPTH,
  type TreeSubgraph,
} from "@/types/tree";

type FetchTreeSubgraphInput = {
  familyId: string;
  rootPersonId: string;
  ancestorDepth?: number;
  descendantDepth?: number;
};

export async function fetchTreeSubgraphAction({
  familyId,
  rootPersonId,
  ancestorDepth = DEFAULT_ANCESTOR_DEPTH,
  descendantDepth = DEFAULT_DESCENDANT_DEPTH,
}: FetchTreeSubgraphInput): Promise<TreeSubgraph> {
  await requireUser();

  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    throw new Error("You do not have permission to view this family tree.");
  }

  const safeAncestorDepth = Math.min(
    Math.max(ancestorDepth, 0),
    MAX_TREE_DEPTH,
  );
  const safeDescendantDepth = Math.min(
    Math.max(descendantDepth, 0),
    MAX_TREE_DEPTH,
  );

  return getTreeSubgraph(
    rootPersonId,
    safeAncestorDepth,
    safeDescendantDepth,
  );
}
