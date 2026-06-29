import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFamilyById } from "@/features/families/family-service";
import { PersonForm } from "@/features/persons/person-form";
import { canManagePersons } from "@/lib/family/permissions";

type NewPersonPageProps = {
  params: Promise<{ familyId: string }>;
};

export const metadata: Metadata = {
  title: "Add person",
};

export default async function NewPersonPage({ params }: NewPersonPageProps) {
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Add person</h1>
            <p className="text-muted-foreground">
              Add a new member to {family.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}/persons`}>Cancel</Link>
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Person details</CardTitle>
            <CardDescription>
              Enter genealogy information for this family member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonForm familyId={familyId} mode="create" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
