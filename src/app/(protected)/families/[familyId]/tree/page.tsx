import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { FamilyTreeView } from "@/features/family-tree/family-tree-view";
import { getPersonsForTree } from "@/features/family-tree/tree-service";
import { getFamilyById } from "@/features/families/family-service";
import { canViewPersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type FamilyTreePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("tree.title") };
}

export default async function FamilyTreePage({
  params,
  searchParams,
}: FamilyTreePageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const resolvedSearchParams = await searchParams;
  const family = await getFamilyById(familyId);

  if (!family || !canViewPersons()) {
    notFound();
  }

  const persons = await getPersonsForTree(familyId);
  const rootParam = resolvedSearchParams.root;
  const requestedRootId = typeof rootParam === "string" ? rootParam : undefined;
  const initialRootPersonId =
    persons.find((person) => person.id === requestedRootId)?.id ??
    persons[0]?.id ??
    "";

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-4 px-4 py-6">
        <section className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("tree.heading", { familyName: family.name })}
            </h1>
            <p className="text-muted-foreground">{t("tree.description")}</p>
          </div>
          <Button asChild variant="outline" size="icon">
            <Link
              href={`/families/${familyId}`}
              aria-label={t("common.backToFamily")}
            >
              <ArrowLeft className="size-4" />
            </Link>
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
