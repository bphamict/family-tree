"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/features/families/family-actions";
import { ROLE_LABELS } from "@/lib/family/constants";
import type { Family, FamilyInvitation } from "@/types/family";

type PendingInvitationsProps = {
  invitations: Array<FamilyInvitation & { family: Family }>;
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const [isPending, startTransition] = useTransition();

  function handleAccept(token: string) {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);

      if (result?.error) {
        toast.error(result.error);
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
          <div className="flex flex-col gap-1">
            <p className="font-medium">{invitation.family.name}</p>
            <p className="text-muted-foreground text-sm">
              Invited as {ROLE_LABELS[invitation.role]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pending</Badge>
            <Button
              type="button"
              size="sm"
              onClick={() => handleAccept(invitation.token)}
              disabled={isPending}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDecline(invitation.id)}
              disabled={isPending}
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
