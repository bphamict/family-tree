import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvitationList } from "@/features/families/invitation-list";
import { InviteMemberForm } from "@/features/families/invite-member-form";
import {
  getFamilyById,
  getFamilyInvitations,
  getFamilyMembers,
} from "@/features/families/family-service";
import { MembershipList } from "@/features/families/membership-list";
import { requireUser } from "@/lib/auth/require-user";
import { canInviteMembers, canManageMembers } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type FamilyMembersPageProps = {
  params: Promise<{ familyId: string }>;
};

export default async function FamilyMembersPage({
  params,
}: FamilyMembersPageProps) {
  const t = await getTranslations();
  const user = await requireUser();
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family) {
    notFound();
  }

  const canInvite = canInviteMembers(family.membership.role);
  const canManage = canManageMembers(family.membership.role);

  const [members, invitations] = await Promise.all([
    getFamilyMembers(familyId),
    canInvite ? getFamilyInvitations(familyId) : Promise.resolve([]),
  ]);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
        <section className="flex flex-col gap-4">
          <PageHeader
            actions={
              <Button asChild variant="outline" size="icon">
                <Link
                  href={`/families/${familyId}`}
                  aria-label={t("common.backToFamily")}
                >
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            }
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {t("person.membersHeading", { familyName: family.name })}
              </h1>
              <p className="text-muted-foreground">
                {t("family.membersDescription")}
              </p>
            </div>
          </PageHeader>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("family.membersTitle")}</CardTitle>
            <CardDescription>{t("family.membersDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MembershipList
              familyId={familyId}
              members={members}
              currentUserId={user.id}
              canManage={canManage}
            />
          </CardContent>
        </Card>

        {canInvite && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("family.inviteEmail")}</CardTitle>
                <CardDescription>{t("family.sendInvitation")}</CardDescription>
              </CardHeader>
              <CardContent>
                <InviteMemberForm familyId={familyId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("family.pendingInvitations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <InvitationList
                  familyId={familyId}
                  invitations={invitations}
                  canManage={canInvite}
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </PageShell>
  );
}
