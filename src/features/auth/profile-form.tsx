"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/features/auth/profile-actions";
import type { Profile } from "@/features/auth/profile-service";
import { useTranslations } from "@/lib/i18n/use-translator";

type ProfileFormProps = {
  profile: Profile;
  email: string | null;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t("common.fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name ?? ""}
          autoComplete="name"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email ?? ""}
          readOnly
          disabled
        />
        <p className="text-muted-foreground text-sm">
          {t("profile.emailReadOnly")}
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
