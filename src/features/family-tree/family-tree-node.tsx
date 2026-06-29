"use client";

import Link from "next/link";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPersonName } from "@/types/person";
import type { TreeLayoutNode } from "@/types/tree";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from "@/types/tree";

type FamilyTreeNodeProps = {
  node: TreeLayoutNode;
  familyId: string;
  onSetRoot: (personId: string) => void;
};

export function FamilyTreeNodeCard({
  node,
  familyId,
  onSetRoot,
}: FamilyTreeNodeProps) {
  const { person, x, y, isRoot } = node;
  const lifespan = formatLifespan(person.birth_date, person.death_date);

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: TREE_NODE_WIDTH,
        height: TREE_NODE_HEIGHT,
      }}
    >
      <div
        className={cn(
          "bg-card flex h-full flex-col gap-2 rounded-xl border p-3 shadow-sm",
          isRoot && "ring-primary ring-2",
        )}
      >
        <div className="flex items-start gap-2">
          <PersonAvatar person={person} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold">
                {formatPersonName(person)}
              </p>
              {isRoot && <Badge variant="secondary">Root</Badge>}
            </div>
            {lifespan && (
              <p className="text-muted-foreground truncate text-xs">{lifespan}</p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1">
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href={`/families/${familyId}/persons/${person.id}`}>
              Profile
            </Link>
          </Button>
          {!isRoot && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onSetRoot(person.id)}
            >
              Set root
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatLifespan(
  birthDate: string | null,
  deathDate: string | null,
): string | null {
  if (!birthDate && !deathDate) {
    return null;
  }

  if (birthDate && deathDate) {
    return `${birthDate} – ${deathDate}`;
  }

  return birthDate ?? deathDate;
}
