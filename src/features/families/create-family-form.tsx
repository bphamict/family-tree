"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFamilyAction } from "@/features/families/family-actions";
import { useTranslations } from "@/lib/i18n/use-translator";

export function CreateFamilyForm() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFamilyAction(formData);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("family.familyName")}</Label>
        <Input
          id="name"
          name="name"
          placeholder={t("family.familyNamePlaceholder")}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{t("common.description")}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t("family.descriptionPlaceholder")}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("common.creating") : t("family.createFamily")}
      </Button>
    </form>
  );
}
