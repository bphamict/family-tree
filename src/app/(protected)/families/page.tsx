import type { Metadata } from "next";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateFamilyDialog } from "@/features/families/create-family-form";
import { FamilyCard } from "@/features/families/family-card";
import {
  getPendingInvitationsForEmail,
  getUserFamilies,
} from "@/features/families/family-service";
import { PendingInvitations } from "@/features/families/pending-invitations";
import { requireUser } from "@/lib/auth/require-user";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("family.title") };
}

export default async function FamiliesPage() {
  const t = await getTranslations();
  const user = await requireUser();
  const [families, pendingInvitations] = await Promise.all([
    getUserFamilies(user.id),
    user.email
      ? getPendingInvitationsForEmail(user.email)
      : Promise.resolve([]),
  ]);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <PageHeader
          actions={
            <CreateFamilyDialog triggerAriaLabel={t("family.createTitle")} />
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("family.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("family.manageFamilies")}
            </p>
          </div>
        </PageHeader>

        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("family.pendingInvitations")}</CardTitle>
              <CardDescription>
                {t("family.pendingInvitationsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingInvitations invitations={pendingInvitations} />
            </CardContent>
          </Card>
        )}

        {families.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
            <p className="text-muted-foreground">{t("family.noFamiliesYet")}</p>
            <CreateFamilyDialog
              triggerAriaLabel={t("family.createFirstFamily")}
            />
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {families.map((family) => (
              <FamilyCard key={family.id} family={family} />
            ))}
          </section>
        )}
      </PageContainer>
    </PageShell>
  );
}
