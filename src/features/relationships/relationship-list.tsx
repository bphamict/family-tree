"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteRelationshipAction } from "@/features/relationships/relationship-actions";
import { RELATIONSHIP_GROUP_LABELS } from "@/lib/relationship/constants";
import { formatPersonName } from "@/types/person";
import type {
  PersonRelationshipGroups,
  PersonRelationshipView,
} from "@/types/relationship";

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
  const entries: Array<{
    title: string;
    items: PersonRelationshipView[];
  }> = [
    { title: RELATIONSHIP_GROUP_LABELS.parents, items: groups.parents },
    { title: RELATIONSHIP_GROUP_LABELS.spouses, items: groups.spouses },
    { title: RELATIONSHIP_GROUP_LABELS.children, items: groups.children },
    { title: RELATIONSHIP_GROUP_LABELS.guardians, items: groups.guardians },
    { title: RELATIONSHIP_GROUP_LABELS.wards, items: groups.wards },
  ].filter((entry) => entry.items.length > 0);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No relationships recorded yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {entries.map((entry) => (
        <RelationshipGroup
          key={entry.title}
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
  title: string;
  familyId: string;
  personId: string;
  items: PersonRelationshipView[];
  canManage: boolean;
};

function RelationshipGroup({
  title,
  familyId,
  personId,
  items,
  canManage,
}: RelationshipGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="divide-y rounded-lg border">
        {items.map((item) => (
          <RelationshipRow
            key={item.relationship.id}
            familyId={familyId}
            personId={personId}
            item={item}
            canManage={canManage}
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
};

function RelationshipRow({
  familyId,
  personId,
  item,
  canManage,
}: RelationshipRowProps) {
  const [isPending, startTransition] = useTransition();
  const { relationship, relatedPerson, displayLabel } = item;
  const dateRange = formatDateRange(relationship.start_date, relationship.end_date);

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

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <PersonAvatar person={relatedPerson} size="sm" />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/families/${familyId}/persons/${relatedPerson.id}`}
              className="font-medium hover:underline"
            >
              {formatPersonName(relatedPerson)}
            </Link>
            <Badge variant="outline">{displayLabel}</Badge>
            {relatedPerson.archived_at && (
              <Badge variant="secondary">Archived</Badge>
            )}
          </div>
          {dateRange && (
            <p className="text-muted-foreground text-sm">{dateRange}</p>
          )}
        </div>
      </div>

      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "Removing..." : "Remove"}
        </Button>
      )}
    </div>
  );
}

function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }

  if (startDate) {
    return `From ${startDate}`;
  }

  return `Until ${endDate}`;
}
