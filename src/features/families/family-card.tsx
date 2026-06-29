import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/family/constants";
import type { FamilyWithMembership } from "@/types/family";

type FamilyCardProps = {
  family: FamilyWithMembership;
};

export function FamilyCard({ family }: FamilyCardProps) {
  const isArchived = Boolean(family.archived_at);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle>{family.name}</CardTitle>
            <CardDescription>
              {family.description ?? "No description"}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline">{ROLE_LABELS[family.membership.role]}</Badge>
            {isArchived && <Badge variant="secondary">Archived</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href={`/families/${family.id}`}>View family</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
