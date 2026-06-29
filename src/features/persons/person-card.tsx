import Link from "next/link";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GENDER_LABELS } from "@/lib/person/constants";
import { formatPersonName, type Person } from "@/types/person";

type PersonCardProps = {
  familyId: string;
  person: Person;
};

export function PersonCard({ familyId, person }: PersonCardProps) {
  const isArchived = Boolean(person.archived_at);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <PersonAvatar person={person} size="md" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{formatPersonName(person)}</CardTitle>
            {isArchived && <Badge variant="secondary">Archived</Badge>}
          </div>
          {person.occupation && (
            <p className="text-muted-foreground text-sm">{person.occupation}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
          {person.gender && (
            <div>
              <span className="text-foreground font-medium">Gender: </span>
              {GENDER_LABELS[person.gender]}
            </div>
          )}
          {person.birth_date && (
            <div>
              <span className="text-foreground font-medium">Born: </span>
              {person.birth_date}
            </div>
          )}
          {person.death_date && (
            <div>
              <span className="text-foreground font-medium">Died: </span>
              {person.death_date}
            </div>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={`/families/${familyId}/persons/${person.id}`}>
            View profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
