import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { KinshipLookup } from "@/features/kinship/kinship-lookup";
import { getKinshipLookupData } from "@/features/kinship/kinship-service";
import { getFamilyById } from "@/features/families/family-service";
import { canViewPersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type KinshipPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("kinship.title") };
}

export default async function KinshipPage({
  params,
  searchParams,
}: KinshipPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    notFound();
  }

  const { persons, kinshipPersons, relationships } =
    await getKinshipLookupData(familyId);

  const speakerParam = resolvedSearchParams.speaker;
  const targetParam = resolvedSearchParams.target;
  const initialSpeakerId =
    typeof speakerParam === "string" ? speakerParam : undefined;
  const initialTargetId =
    typeof targetParam === "string" ? targetParam : undefined;

  const validSpeakerId = persons.some(
    (person) => person.id === initialSpeakerId,
  )
    ? initialSpeakerId
    : "";
  const validTargetId = persons.some((person) => person.id === initialTargetId)
    ? initialTargetId
    : "";

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <PageHeader
          actions={
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/families/${familyId}`}
                aria-label={t("common.backToFamily")}
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("kinship.heading", { familyName: family.name })}
            </h1>
            <p className="text-muted-foreground">{t("kinship.description")}</p>
          </div>
        </PageHeader>

        {persons.length < 2 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            {t("kinship.needMorePeople")}
          </p>
        ) : (
          <KinshipLookup
            familyId={familyId}
            persons={persons}
            kinshipPersons={kinshipPersons}
            relationships={relationships}
            initialSpeakerId={validSpeakerId}
            initialTargetId={validTargetId}
          />
        )}
      </PageContainer>
    </PageShell>
  );
}
