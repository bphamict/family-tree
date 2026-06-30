import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { PageContainer } from "@/components/shared/page-container";
import { PageShell } from "@/components/shared/page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DataImportExportPanel } from "@/features/data/data-import-export-panel";
import { getFamilyById } from "@/features/families/family-service";
import { canExportData, canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";

type DataPageProps = {
  params: Promise<{ familyId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("data.pageTitle") };
}

export default async function FamilyDataPage({ params }: DataPageProps) {
  const t = await getTranslations();
  const { familyId } = await params;
  const family = await getFamilyById(familyId);

  if (!family || !canExportData()) {
    notFound();
  }

  const canImport = canManagePersons(family.membership.role);

  return (
    <PageShell>
      <AppHeader />

      <PageContainer>
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
              {t("data.pageHeading", { familyName: family.name })}
            </h1>
            <p className="text-muted-foreground">{t("data.pageDescription")}</p>
          </div>
        </PageHeader>

        <DataImportExportPanel familyId={familyId} canImport={canImport} />
      </PageContainer>
    </PageShell>
  );
}
