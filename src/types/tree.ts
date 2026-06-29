import type { Person } from "@/types/person";
import type { StoredRelationshipType } from "@/types/relationship";

export type TreePerson = Pick<
  Person,
  | "id"
  | "first_name"
  | "middle_name"
  | "last_name"
  | "other_name"
  | "birth_date"
  | "death_date"
  | "avatar_url"
  | "gender"
>;

export type TreeEdgeType = StoredRelationshipType;

export type TreeEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: TreeEdgeType;
  birthOrder: number | null;
};

export type TreeSubgraph = {
  rootPersonId: string;
  nodes: TreePerson[];
  edges: TreeEdge[];
  hasMoreAncestors: boolean;
  hasMoreDescendants: boolean;
};

export type TreeLayoutNode = {
  person: TreePerson;
  x: number;
  y: number;
  generation: number;
  isRoot: boolean;
};

export type TreeViewport = {
  x: number;
  y: number;
  scale: number;
};

export const DEFAULT_ANCESTOR_DEPTH = 2;
export const DEFAULT_DESCENDANT_DEPTH = 2;
export const MAX_TREE_DEPTH = 6;

export const TREE_NODE_WIDTH = 120;
export const TREE_NODE_HEIGHT = 168;
export const TREE_HORIZONTAL_GAP = 48;
export const TREE_GENERATION_GAP = 48;
export const TREE_VERTICAL_GAP = TREE_NODE_HEIGHT + TREE_GENERATION_GAP;
export const TREE_SPOUSE_GAP = 24;
