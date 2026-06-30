import Link from "next/link";
import {
  ArrowRight,
  BookUser,
  Calendar,
  FileText,
  Network,
  UsersRound,
} from "lucide-react";

import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { LandingFeatureCard } from "@/features/landing/landing-feature-card";
import { getUser } from "@/lib/auth/get-user";
import { getTranslations } from "@/lib/i18n/translator";

export default async function LandingPage() {
  const t = await getTranslations();
  const user = await getUser();

  const features = [
    {
      icon: Network,
      title: t("landing.featureTreeTitle"),
      description: t("landing.featureTreeDescription"),
    },
    {
      icon: UsersRound,
      title: t("landing.featureMembersTitle"),
      description: t("landing.featureMembersDescription"),
    },
    {
      icon: Calendar,
      title: t("landing.featureTimelineTitle"),
      description: t("landing.featureTimelineDescription"),
    },
    {
      icon: FileText,
      title: t("landing.featureDocumentsTitle"),
      description: t("landing.featureDocumentsDescription"),
    },
    {
      icon: BookUser,
      title: t("landing.featureKinshipTitle"),
      description: t("landing.featureKinshipDescription"),
    },
  ] as const;

  return (
    <PageShell>
      <AppHeader />

      <div className="flex flex-1 flex-col">
        <section className="border-b">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
            <div className="flex max-w-3xl flex-col gap-6">
              <p className="text-primary text-sm font-medium tracking-wide uppercase">
                {t("common.appName")}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                {t("landing.title")}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed text-pretty md:text-xl">
                {t("landing.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/families">
                    <UsersRound className="size-4" aria-hidden />
                    {t("landing.viewFamilies")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/register">
                      {t("landing.getStarted")}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">{t("common.signIn")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 flex-1">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 md:py-20">
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("landing.featuresTitle")}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
                {t("landing.featuresDescription")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <LandingFeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {!user && (
          <section className="border-t">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center">
              <div className="flex max-w-xl flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  {t("landing.ctaTitle")}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.ctaDescription")}
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/register">{t("landing.getStarted")}</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
