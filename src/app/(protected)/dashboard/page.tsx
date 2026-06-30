import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateFamilyDialog } from "@/features/families/create-family-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileByUserId } from "@/features/auth/profile-service";
import { PendingInvitations } from "@/features/families/pending-invitations";
import {
  getActiveFamily,
  getPendingInvitationsForEmail,
  getUserFamilies,
} from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("common.dashboard") };
}

export default async function DashboardPage() {
  const t = await getTranslations();
  const user = await requireUser();
  const [profile, families, activeFamily, pendingInvitations] =
    await Promise.all([
      getProfileByUserId(user.id),
      getUserFamilies(user.id),
      getActiveFamily(user.id),
      user.email
        ? getPendingInvitationsForEmail(user.email)
        : Promise.resolve([]),
    ]);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("common.dashboard")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {profile?.full_name
              ? t("common.welcomeBackWithName", {
                  name: `, ${profile.full_name}`,
                })
              : t("common.welcomeBack", { name: "" })}
          </p>
        </section>

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

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("family.activeFamily")}</CardTitle>
              <CardDescription>
                {t("family.activeFamilyDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeFamily ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{activeFamily.name}</p>
                    {activeFamily.archived_at && (
                      <Badge variant="secondary">{t("common.archived")}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("common.role", {
                      role: t(`family.roles.${activeFamily.membership.role}`),
                    })}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/families/${activeFamily.id}`}>
                      {t("common.viewFamily")}
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">
                    {t("family.notJoinedFamily")}
                  </p>
                  <CreateFamilyDialog
                    triggerAriaLabel={t("family.createAFamily")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("family.yourFamilies")}</CardTitle>
              <CardDescription>
                {t("common.familyCount", { count: families.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {families.length > 0 ? (
                <>
                  <ul className="space-y-2 text-sm">
                    {families.slice(0, 3).map((family) => (
                      <li
                        key={family.id}
                        className="flex items-center justify-between"
                      >
                        <span>{family.name}</span>
                        <Badge variant="outline">
                          {t(`family.roles.${family.membership.role}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/families">{t("common.viewAllFamilies")}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("family.getStartedFamilies")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("family.yourProfile")}</CardTitle>
              <CardDescription>
                {t("family.yourProfileDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t("common.email")}</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("common.fullName")}</p>
                <p className="font-medium">
                  {profile?.full_name ?? t("common.notSet")}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </PageShell>
  );
}
