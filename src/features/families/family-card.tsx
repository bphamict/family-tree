import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n/translator";
import type { FamilyWithMembership } from "@/types/family";

type FamilyCardProps = {
  family: FamilyWithMembership;
};

export async function FamilyCard({ family }: FamilyCardProps) {
  const t = await getTranslations();
  const isArchived = Boolean(family.archived_at);

  return (
    <Link
      href={`/families/${family.id}`}
      className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="hover:border-primary/40 hover:bg-muted/30 h-full transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle>{family.name}</CardTitle>
              <CardDescription>
                {family.description ?? t("common.noDescription")}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline">
                {t(`family.roles.${family.membership.role}`)}
              </Badge>
              {isArchived && (
                <Badge variant="secondary">{t("common.archived")}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
