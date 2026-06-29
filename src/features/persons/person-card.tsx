import Link from "next/link";

import { GenderIcon } from "@/components/shared/gender-icon";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Badge } from "@/components/ui/badge";
import { formatLifespan } from "@/lib/date/format";
import { getTranslations } from "@/lib/i18n/translator";
import { cn } from "@/lib/utils";
import { formatPersonName, type Person } from "@/types/person";

type PersonCardProps = {
  familyId: string;
  person: Person;
};

export async function PersonCard({ familyId, person }: PersonCardProps) {
  const t = await getTranslations();
  const isArchived = Boolean(person.archived_at);
  const lifespan = formatLifespan(person.birth_date, person.death_date);

  return (
    <Link
      href={`/families/${familyId}/persons/${person.id}`}
      className="group focus-visible:ring-ring focus-visible:ring-offset-background block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <article
        className={cn(
          "bg-card flex h-full items-start gap-4 rounded-xl border p-4 shadow-sm transition-colors",
          "hover:border-primary/40 hover:bg-muted/30",
          isArchived && "opacity-75",
        )}
      >
        <div className="relative shrink-0">
          <PersonAvatar person={person} size="md" />
          {person.gender && (
            <span className="bg-card absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border shadow-sm">
              <GenderIcon
                gender={person.gender}
                label={t(`person.genderLabels.${person.gender}`)}
              />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base leading-tight font-semibold">
              {formatPersonName(person)}
              {person.other_name && (
                <span className="text-muted-foreground font-normal italic">
                  {" "}
                  ({person.other_name})
                </span>
              )}
            </h3>
            {isArchived && (
              <Badge variant="secondary">{t("common.archived")}</Badge>
            )}
          </div>
          {lifespan && (
            <p className="text-muted-foreground text-sm tabular-nums">
              {lifespan}
            </p>
          )}
          {person.occupation && (
            <p className="text-muted-foreground line-clamp-1 text-sm">
              {person.occupation}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
