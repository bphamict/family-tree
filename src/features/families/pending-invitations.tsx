"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FamilyAvatar } from "@/components/shared/family-avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/features/families/family-actions";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { PendingInvitation } from "@/types/family";

type PendingInvitationsProps = {
  invitations: PendingInvitation[];
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept(token: string) {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.familyId) {
        toast.success(result.success);
        router.push(`/families/${result.familyId}`);
        router.refresh();
      }
    });
  }

  function handleDecline(invitationId: string) {
    startTransition(async () => {
      const result = await declineInvitationAction(invitationId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <FamilyAvatar name={invitation.family.name} size="sm" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate font-medium">{invitation.family.name}</p>
              <p className="text-muted-foreground text-sm">
                {t("common.invitedAs", {
                  role: t(`family.roles.${invitation.role}`),
                })}
              </p>
              {invitation.inviter ? (
                <div className="flex items-center gap-2">
                  <UserAvatar
                    fullName={invitation.inviter.full_name}
                    avatarUrl={invitation.inviter.avatar_url}
                    size="sm"
                    className="size-6 text-[10px]"
                  />
                  <p className="text-muted-foreground truncate text-xs">
                    {t("family.invitedBy", {
                      name:
                        invitation.inviter.full_name?.trim() ||
                        t("common.familyMember"),
                    })}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("common.pending")}</Badge>
            <Button
              type="button"
              size="sm"
              onClick={() => handleAccept(invitation.token)}
              disabled={isPending}
            >
              {t("family.accept")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecline(invitation.id)}
              disabled={isPending}
            >
              {t("family.decline")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
