import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ROLE_LABELS } from "@/lib/family/constants";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}.
          </p>
        </section>

        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending invitations</CardTitle>
              <CardDescription>
                You have been invited to join the following families.
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
              <CardTitle>Active family</CardTitle>
              <CardDescription>
                The family you are currently working with.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeFamily ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{activeFamily.name}</p>
                    {activeFamily.archived_at && (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Role: {ROLE_LABELS[activeFamily.membership.role]}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/families/${activeFamily.id}`}>
                      View family
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">
                    You have not joined a family yet.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/families/new">Create a family</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your families</CardTitle>
              <CardDescription>
                {families.length} famil{families.length === 1 ? "y" : "ies"}{" "}
                total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {families.length > 0 ? (
                <>
                  <ul className="space-y-2 text-sm">
                    {families.slice(0, 3).map((family) => (
                      <li key={family.id} className="flex items-center justify-between">
                        <span>{family.name}</span>
                        <Badge variant="outline">
                          {ROLE_LABELS[family.membership.role]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/families">View all families</Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Create a family or accept an invitation to get started.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>
                Account information from your user profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Full name</p>
                <p className="font-medium">{profile?.full_name ?? "Not set"}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
