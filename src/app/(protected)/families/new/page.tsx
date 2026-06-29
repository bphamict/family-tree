import type { Metadata } from "next";

import { AppHeader } from "@/components/shared/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateFamilyForm } from "@/features/families/create-family-form";

export const metadata: Metadata = {
  title: "Create family",
};

export default function NewFamilyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create a family
          </h1>
          <p className="text-muted-foreground">
            Start a new family tree. You will be assigned as the owner.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Family details</CardTitle>
            <CardDescription>
              Enter a name and optional description for your family.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateFamilyForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
