"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { GenderIcon } from "@/components/shared/gender-icon";
import { PersonSelect } from "@/components/shared/person-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { buildKinshipGraph } from "@/lib/kinship/build-graph";
import { lookupKinship } from "@/lib/kinship/resolve-kinship";
import type {
  KinshipPerson,
  KinshipRelationship,
  KinshipTermKey,
} from "@/lib/kinship/types";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { Translator } from "@/lib/i18n/translator";
import { formatPersonName, type Person } from "@/types/person";

type KinshipLookupProps = {
  familyId: string;
  persons: Person[];
  kinshipPersons: KinshipPerson[];
  relationships: KinshipRelationship[];
  initialSpeakerId?: string;
  initialTargetId?: string;
};

export function KinshipLookup({
  familyId,
  persons,
  kinshipPersons,
  relationships,
  initialSpeakerId = "",
  initialTargetId = "",
}: KinshipLookupProps) {
  const t = useTranslations();
  const [speakerId, setSpeakerId] = useState(initialSpeakerId);
  const [targetId, setTargetId] = useState(initialTargetId);

  const graph = useMemo(
    () => buildKinshipGraph(kinshipPersons, relationships),
    [kinshipPersons, relationships],
  );

  const result = useMemo(() => {
    if (!speakerId || !targetId) {
      return null;
    }

    return lookupKinship(graph, speakerId, targetId);
  }, [graph, speakerId, targetId]);

  const speaker = persons.find((person) => person.id === speakerId);
  const target = persons.find((person) => person.id === targetId);

  function handleSwap() {
    setSpeakerId(targetId);
    setTargetId(speakerId);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("kinship.formTitle")}</CardTitle>
          <CardDescription>{t("kinship.formDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-3">
          <div className="grid gap-2">
            <Label htmlFor="kinship-speaker">{t("kinship.speakerLabel")}</Label>
            <PersonSelect
              id="kinship-speaker"
              persons={persons}
              value={speakerId}
              onValueChange={setSpeakerId}
              placeholder={t("kinship.selectPerson")}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mx-auto shrink-0 sm:mb-0.5"
            onClick={handleSwap}
            disabled={!speakerId && !targetId}
            aria-label={t("kinship.swapAriaLabel")}
          >
            <ArrowLeftRight className="size-4" />
          </Button>

          <div className="grid gap-2">
            <Label htmlFor="kinship-target">{t("kinship.targetLabel")}</Label>
            <PersonSelect
              id="kinship-target"
              persons={persons}
              value={targetId}
              onValueChange={setTargetId}
              placeholder={t("kinship.selectPerson")}
            />
          </div>
        </CardContent>
      </Card>

      {result && speaker && target && (
        <Card>
          <CardHeader>
            <CardTitle>{t("kinship.resultTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <KinshipPersonSummary
                familyId={familyId}
                person={speaker}
                role={t("kinship.speakerRole")}
              />
              <KinshipPersonSummary
                familyId={familyId}
                person={target}
                role={t("kinship.targetRole")}
              />
            </div>

            <div className="bg-muted/40 rounded-xl border p-6">
              <p className="text-muted-foreground text-sm">
                {t("kinship.addressLabel")}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatTerm(t, result.termKey)}
              </p>
              {result.noteKey && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {t(`kinship.notes.${result.noteKey}`)}
                </p>
              )}
            </div>

            {result.reverseTermKey && result.termKey !== "self" && (
              <div className="rounded-xl border p-6">
                <p className="text-muted-foreground text-sm">
                  {t("kinship.reverseLabel", {
                    name: formatPersonName(target),
                    otherName: formatPersonName(speaker),
                  })}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatTerm(t, result.reverseTermKey)}
                </p>
              </div>
            )}

            {result.termKey === "unrelated" && (
              <p className="text-muted-foreground text-sm">
                {t("kinship.unrelatedHint")}
              </p>
            )}

            {result.termKey === "unknown" && (
              <p className="text-muted-foreground text-sm">
                {t("kinship.unknownHint")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type KinshipPersonSummaryProps = {
  familyId: string;
  person: Person;
  role: string;
};

function KinshipPersonSummary({
  familyId,
  person,
  role,
}: KinshipPersonSummaryProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
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
      <div className="min-w-0">
        <Badge variant="secondary" className="mb-1">
          {role}
        </Badge>
        <Link
          href={`/families/${familyId}/persons/${person.id}`}
          className="block truncate font-medium hover:underline"
        >
          {formatPersonName(person)}
        </Link>
      </div>
    </div>
  );
}

function formatTerm(t: Translator, termKey: KinshipTermKey): string {
  return t(`kinship.terms.${termKey}`);
}
