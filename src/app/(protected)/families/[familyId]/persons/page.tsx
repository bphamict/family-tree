import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { getFamilyById } from "@/features/families/family-service";
import { PersonCard } from "@/features/persons/person-card";
import { PersonSearchForm } from "@/features/persons/person-search-form";
import { getPersonsByFamily } from "@/features/persons/person-service";
import {
  canManagePersons,
  canViewPersons,
} from "@/lib/family/permissions";
import type { PersonGender, PersonSearchFilters } from "@/types/person";

type PersonsPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Family members",
};

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
              {family.name} members
            </h1>
            <p className="text-muted-foreground">
              {persons.length} person{persons.length === 1 ? "" : "s"} found
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}`}>Back to family</Link>
            </Button>
            {canManage && (
              <Button asChild>
                <Link href={`/families/${familyId}/persons/new`}>
                  Add person
                </Link>
              </Button>
            )}
          </div>
        </section>

        <PersonSearchForm filters={filters} />

        {persons.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No family members match your search.
            </p>
            {canManage && (
              <Button asChild className="mt-4">
                <Link href={`/families/${familyId}/persons/new`}>
                  Add the first person
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
