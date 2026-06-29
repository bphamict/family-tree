import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { FamilyTreeView } from "@/features/family-tree/family-tree-view";
import { getPersonsForTree } from "@/features/family-tree/tree-service";
import { getFamilyById } from "@/features/families/family-service";
import { canViewPersons } from "@/lib/family/permissions";

type FamilyTreePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Family tree",
};

export default async function FamilyTreePage({
  params,
  searchParams,
}: FamilyTreePageProps) {
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    notFound();
  }

  const persons = await getPersonsForTree(familyId);
  const rootParam = resolvedSearchParams.root;
  const requestedRootId =
    typeof rootParam === "string" ? rootParam : undefined;
  const initialRootPersonId =
    persons.find((person) => person.id === requestedRootId)?.id ??
    persons[0]?.id ??
    "";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {family.name} tree
            </h1>
            <p className="text-muted-foreground">
              Explore ancestors, descendants, and spouses. Drag to pan, scroll to
              zoom, and expand generations as needed.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}`}>Back to family</Link>
          </Button>
        </section>

        <FamilyTreeView
          familyId={familyId}
          persons={persons}
          initialRootPersonId={initialRootPersonId}
        />
      </main>
    </div>
  );
}
