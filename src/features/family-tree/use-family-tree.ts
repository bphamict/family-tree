"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTreeSubgraphAction } from "@/features/family-tree/tree-actions";

type UseFamilyTreeOptions = {
  familyId: string;
  rootPersonId: string;
  ancestorDepth: number;
  descendantDepth: number;
};

export function useFamilyTree({
  familyId,
  rootPersonId,
  ancestorDepth,
  descendantDepth,
}: UseFamilyTreeOptions) {
  return useQuery({
    queryKey: [
      "family-tree",
      familyId,
      rootPersonId,
      ancestorDepth,
      descendantDepth,
    ],
    queryFn: () =>
      fetchTreeSubgraphAction({
        familyId,
        rootPersonId,
        ancestorDepth,
        descendantDepth,
      }),
    enabled: Boolean(rootPersonId),
  });
}
