"use client";

import Link from "next/link";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { GenderIcon } from "@/components/shared/gender-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLifespan } from "@/lib/date/format";
import { useTranslations } from "@/lib/i18n/use-translator";
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
  const t = useTranslations();
  const { person, x, y, isRoot } = node;
  const lifespan = formatLifespan(person.birth_date, person.death_date);

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left: x,
        top: y,
        width: TREE_NODE_WIDTH,
        height: TREE_NODE_HEIGHT,
      }}
    >
      <div
        className={cn(
          "bg-card hover:border-primary/60 flex h-full flex-col items-center justify-between gap-1 overflow-hidden rounded-xl border p-2 shadow-sm transition-colors",
          isRoot && "ring-primary ring-2",
        )}
      >
        <div className="flex w-full flex-col items-center gap-1">
          <div className="relative shrink-0">
            <PersonAvatar person={person} size="sm" />
            {person.gender && (
              <span className="bg-card absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border shadow-sm">
                <GenderIcon
                  gender={person.gender}
                  label={t(`person.genderLabels.${person.gender}`)}
                  iconClassName="size-3"
                />
              </span>
            )}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-0.5 px-0.5 text-center">
            <p className="w-full text-xs leading-snug font-semibold break-words">
              {formatPersonName(person)}
            </p>
            {person.other_name && (
              <p className="text-muted-foreground w-full truncate text-[10px] leading-tight italic">
                ({person.other_name})
              </p>
            )}
            {lifespan && (
              <p className="text-muted-foreground text-[10px] leading-tight">
                {lifespan}
              </p>
            )}
          </div>
        </div>

        <div
          className="pointer-events-auto flex w-full shrink-0 flex-col"
          data-no-pan
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 w-full px-1 text-[10px]"
          >
            <Link href={`/families/${familyId}/persons/${person.id}`}>
              {t("common.viewProfile")}
            </Link>
          </Button>
          {!isRoot && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-full px-1 text-[10px]"
              onClick={() => onSetRoot(person.id)}
            >
              {t("tree.setRoot")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
