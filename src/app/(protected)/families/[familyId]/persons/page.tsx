import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { getFamilyById } from "@/features/families/family-service";
import { PersonCard } from "@/features/persons/person-card";
import { PersonSearchForm } from "@/features/persons/person-search-form";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManagePersons, canViewPersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import type { PersonGender, PersonSearchFilters } from "@/types/person";

type PersonsPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("person.membersTitle") };
}

function parseSearchFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PersonSearchFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  const gender = getValue("gender");

  return {
    query: getValue("query"),
    gender: gender ? (gender as PersonGender) : undefined,
    birthYear: getValue("birthYear"),
    deathYear: getValue("deathYear"),
    occupation: getValue("occupation"),
    includeArchived: getValue("includeArchived") === "true",
  };
}

export default async function PersonsPage({
  params,
  searchParams,
}: PersonsPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    notFound();
  }

  const filters = parseSearchFilters(resolvedSearchParams);
  const persons = await getPersonsByFamily(familyId, filters);
  const canManage = canManagePersons(family.membership.role);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("person.membersHeading", { familyName: family.name })}
            </h1>
            <p className="text-muted-foreground">
              {t("common.personCount", { count: persons.length })}
            </p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <Button asChild size="icon">
                <Link
                  href={`/families/${familyId}/persons/new`}
                  aria-label={t("family.addPerson")}
                >
                  <Plus className="size-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/families/${familyId}`}
                aria-label={t("common.backToFamily")}
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <PersonSearchForm filters={filters} />

        {persons.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">{t("person.noResults")}</p>
            {canManage && (
              <Button asChild className="mt-4" size="icon">
                <Link
                  href={`/families/${familyId}/persons/new`}
                  aria-label={t("person.addFirst")}
                >
                  <Plus className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {persons.map((person) => (
              <PersonCard key={person.id} familyId={familyId} person={person} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
