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
import { ProfileAvatarForm } from "@/features/auth/profile-avatar-form";
import { ProfileForm } from "@/features/auth/profile-form";
import { ensureProfile, type Profile } from "@/features/auth/profile-service";
import { requireUser } from "@/lib/auth/require-user";
import { getTranslations } from "@/lib/i18n/translator";

async function loadProfile(
  userId: string,
  fallbackName: string,
): Promise<Profile | null> {
  try {
    return await ensureProfile(userId, fallbackName);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("profile.title") };
}

export default async function ProfilePage() {
  const t = await getTranslations();
  const user = await requireUser();
  const profile = await loadProfile(user.id, user.email ?? "User");

  if (!profile) {
    return (
      <PageShell>
        <AppHeader />
        <PageContainer size="narrow">
          <p className="text-muted-foreground px-6 py-8">
            {t("profile.errors.notFound")}
          </p>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AppHeader />

      <PageContainer size="narrow">
        <PageHeader>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("profile.title")}
            </h1>
            <p className="text-muted-foreground">{t("profile.description")}</p>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.avatarTitle")}</CardTitle>
            <CardDescription>{t("profile.avatarDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileAvatarForm profile={profile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.formTitle")}</CardTitle>
            <CardDescription>{t("profile.formDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} email={user.email ?? null} />
          </CardContent>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
