"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { GenderIcon } from "@/components/shared/gender-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteRelationshipAction,
  reorderChildBirthOrderAction,
} from "@/features/relationships/relationship-actions";
import { formatDisplayDate } from "@/lib/date/format";
import type { Translator } from "@/lib/i18n/translator";
import { useTranslations } from "@/lib/i18n/use-translator";
import { formatPersonName } from "@/types/person";
import type {
  PersonRelationshipGroups,
  PersonRelationshipView,
} from "@/types/relationship";

const GROUP_KEYS = [
  "parents",
  "spouses",
  "children",
  "guardians",
  "wards",
] as const;

type RelationshipGroupKey = (typeof GROUP_KEYS)[number];

type RelationshipListProps = {
  familyId: string;
  personId: string;
  groups: PersonRelationshipGroups;
  canManage: boolean;
};

export function RelationshipList({
  familyId,
  personId,
  groups,
  canManage,
}: RelationshipListProps) {
  const t = useTranslations();

  const entries: Array<{
    groupKey: RelationshipGroupKey;
    title: string;
    items: PersonRelationshipView[];
  }> = GROUP_KEYS.map((groupKey) => ({
    groupKey,
    title: t(`relationship.groups.${groupKey}`),
    items: groups[groupKey],
  })).filter((entry) => entry.items.length > 0);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("relationship.empty")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {entries.map((entry) => (
        <RelationshipGroup
          key={entry.groupKey}
          groupKey={entry.groupKey}
          title={entry.title}
          familyId={familyId}
          personId={personId}
          items={entry.items}
          canManage={canManage}
        />
      ))}
    </div>
  );
}

type RelationshipGroupProps = {
  groupKey: RelationshipGroupKey;
  title: string;
  familyId: string;
  personId: string;
  items: PersonRelationshipView[];
  canManage: boolean;
};

function RelationshipGroup({
  groupKey,
  title,
  familyId,
  personId,
  items,
  canManage,
}: RelationshipGroupProps) {
  const supportsBirthOrder =
    canManage && (groupKey === "children" || groupKey === "wards");

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="divide-y rounded-lg border">
        {items.map((item, index) => (
          <RelationshipRow
            key={item.relationship.id}
            familyId={familyId}
            personId={personId}
            item={item}
            canManage={canManage}
            canReorder={supportsBirthOrder}
            canMoveUp={supportsBirthOrder && index > 0}
            canMoveDown={supportsBirthOrder && index < items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

type RelationshipRowProps = {
  familyId: string;
  personId: string;
  item: PersonRelationshipView;
  canManage: boolean;
  canReorder: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

function RelationshipRow({
  familyId,
  personId,
  item,
  canManage,
  canReorder,
  canMoveUp,
  canMoveDown,
}: RelationshipRowProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const { relationship, relatedPerson, displayLabelKey } = item;
  const dateRange = formatDateRange(
    t,
    relationship.start_date,
    relationship.end_date,
  );

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRelationshipAction(
        familyId,
        personId,
        relationship.id,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  function handleReorder(direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderChildBirthOrderAction(
        familyId,
        personId,
        relationship.id,
        direction,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <PersonAvatar person={relatedPerson} size="sm" />
          {relatedPerson.gender && (
            <span className="bg-card absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border shadow-sm">
              <GenderIcon
                gender={relatedPerson.gender}
                label={t(`person.genderLabels.${relatedPerson.gender}`)}
                iconClassName="size-3"
              />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/families/${familyId}/persons/${relatedPerson.id}`}
              className="font-medium hover:underline"
            >
              {formatPersonName(relatedPerson)}
            </Link>
            <Badge variant="outline">{t(displayLabelKey)}</Badge>
            {canReorder && relationship.birth_order !== null && (
              <Badge variant="secondary">
                {t("relationship.birthOrder")} {relationship.birth_order}
              </Badge>
            )}
            {relatedPerson.archived_at && (
              <Badge variant="secondary">{t("common.archived")}</Badge>
            )}
          </div>
          {dateRange && (
            <p className="text-muted-foreground text-sm">{dateRange}</p>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-2">
          {canReorder && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleReorder("up")}
                disabled={isPending || !canMoveUp}
                aria-label={t("relationship.moveUp")}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleReorder("down")}
                disabled={isPending || !canMoveDown}
                aria-label={t("relationship.moveDown")}
              >
                <ArrowDown className="size-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={t("common.remove")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDateRange(
  t: Translator,
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return t("common.dateRange", {
      start: formatDisplayDate(startDate) ?? startDate,
      end: formatDisplayDate(endDate) ?? endDate,
    });
  }

  if (startDate) {
    return t("common.fromDate", {
      date: formatDisplayDate(startDate) ?? startDate,
    });
  }

  return t("common.untilDate", {
    date: formatDisplayDate(endDate) ?? endDate!,
  });
}
