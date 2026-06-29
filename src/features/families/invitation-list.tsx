"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date/format";
import { cancelInvitationAction } from "@/features/families/family-actions";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { FamilyInvitation } from "@/types/family";

type InvitationListProps = {
  familyId: string;
  invitations: FamilyInvitation[];
  canManage: boolean;
};

export function InvitationList({
  familyId,
  invitations,
  canManage,
}: InvitationListProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleCancel(invitationId: string) {
    startTransition(async () => {
      const result = await cancelInvitationAction(familyId, invitationId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  if (invitations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("family.noInvitations")}
      </p>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <p className="font-medium">{invitation.email}</p>
            <p className="text-muted-foreground text-sm">
              {t("common.expires", {
                date: formatDisplayDate(invitation.expires_at) ?? "",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {t(`family.roles.${invitation.role}`)}
            </Badge>
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCancel(invitation.id)}
                disabled={isPending}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
