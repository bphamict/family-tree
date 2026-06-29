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

type FamilyMembersPageProps = {
  params: Promise<{ familyId: string }>;
};

export default async function FamilyMembersPage({
  params,
}: FamilyMembersPageProps) {
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
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {family.name} members
              </h1>
              <p className="text-muted-foreground">
                Manage who has access to this family.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}`}>Back to family</Link>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              People who currently have access to this family.
            </CardDescription>
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
                <CardTitle>Invite member</CardTitle>
                <CardDescription>
                  Send an email invitation to join this family.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InviteMemberForm familyId={familyId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending invitations</CardTitle>
                <CardDescription>
                  Invitations that have not been accepted yet.
                </CardDescription>
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
      </main>
    </div>
  );
}
