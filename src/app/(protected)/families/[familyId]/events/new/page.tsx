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
import { EventForm } from "@/features/events/event-form";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonsByFamily } from "@/features/persons/person-service";
import { canManageEvents } from "@/lib/family/permissions";

type NewEventPageProps = {
  params: Promise<{ familyId: string }>;
};

export const metadata: Metadata = {
  title: "Add event",
};

export default async function NewEventPage({ params }: NewEventPageProps) {
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManageEvents(family.membership.role)) {
    notFound();
  }

  const persons = await getPersonsByFamily(familyId);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Add event</h1>
            <p className="text-muted-foreground">
              Record a milestone for {family.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}/timeline`}>Cancel</Link>
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Event details</CardTitle>
            <CardDescription>
              Births, weddings, memorials, reunions, and other family milestones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm familyId={familyId} persons={persons} mode="create" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
