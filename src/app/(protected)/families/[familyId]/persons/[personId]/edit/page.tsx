import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getFamilyById } from "@/features/families/family-service";
import { AvatarUploadForm } from "@/features/persons/avatar-upload-form";
import { PersonForm } from "@/features/persons/person-form";
import { getPersonById } from "@/features/persons/person-service";
import { canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPersonName } from "@/types/person";

type EditPersonPageProps = {
  params: Promise<{ familyId: string; personId: string }>;
};

export async function generateMetadata({
  params,
}: EditPersonPageProps): Promise<Metadata> {
  const t = await getTranslations();
  const { familyId, personId } = await params;
  const person = await getPersonById(familyId, personId);

  return {
    title: person
      ? t("person.editHeading", { name: formatPersonName(person) })
      : t("person.editTitle"),
  };
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const t = await getTranslations();
  const { familyId, personId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    notFound();
  }

  const person = await getPersonById(familyId, personId);

  if (!person) {
    notFound();
  }

  return (
    <PageShell>
      <AppHeader />

      <PageContainer size="narrow">
        <PageHeader
          actions={
            <Button asChild variant="outline">
              <Link href={`/families/${familyId}/persons/${personId}`}>
                {t("common.cancel")}
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("person.editHeading", { name: formatPersonName(person) })}
            </h1>
            <p className="text-muted-foreground">
              {t("person.editDescription")}
            </p>
          </div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>{t("person.avatarTitle")}</CardTitle>
            <CardDescription>{t("person.avatarDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUploadForm familyId={familyId} person={person} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("person.editFormTitle")}</CardTitle>
            <CardDescription>{t("person.editDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PersonForm familyId={familyId} person={person} mode="edit" />
          </CardContent>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
