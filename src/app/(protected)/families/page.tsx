import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { FamilyCard } from "@/features/families/family-card";
import { getUserFamilies } from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Families",
};

export default async function FamiliesPage() {
  const user = await requireUser();
  const families = await getUserFamilies(user.id);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Families</h1>
            <p className="text-muted-foreground">
              Manage the families you belong to.
            </p>
          </div>
          <Button asChild>
            <Link href="/families/new">Create family</Link>
          </Button>
        </section>

        {families.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
            <p className="text-muted-foreground">
              You are not part of any family yet. Create one to get started.
            </p>
            <Button asChild>
              <Link href="/families/new">Create your first family</Link>
            </Button>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {families.map((family) => (
              <FamilyCard key={family.id} family={family} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
