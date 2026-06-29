"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMemberAction } from "@/features/families/family-actions";
import { INVITABLE_ROLES } from "@/lib/family/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { InvitableRole } from "@/types/family";

type InviteMemberFormProps = {
  familyId: string;
};

export function InviteMemberForm({ familyId }: InviteMemberFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<InvitableRole>("viewer");

  function handleSubmit(formData: FormData) {
    formData.set("role", role);

    startTransition(async () => {
      const result = await inviteMemberAction(familyId, formData);

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
        <Label htmlFor="email">{t("family.inviteEmail")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("family.inviteEmailPlaceholder")}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">
          {t("common.role", { role: "" }).replace(/: $/, "")}
        </Label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as InvitableRole)}
          disabled={isPending}
        >
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITABLE_ROLES.map((invitableRole) => (
              <SelectItem key={invitableRole} value={invitableRole}>
                {t(`family.roles.${invitableRole}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("common.sending") : t("family.sendInvitation")}
      </Button>
    </form>
  );
}
