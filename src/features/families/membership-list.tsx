"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/features/families/family-actions";
import { formatDisplayDate } from "@/lib/date/format";
import { INVITABLE_ROLES } from "@/lib/family/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { InvitableRole, MembershipWithProfile } from "@/types/family";

type MembershipListProps = {
  familyId: string;
  members: MembershipWithProfile[];
  currentUserId: string;
  canManage: boolean;
};

export function MembershipList({
  familyId,
  members,
  currentUserId,
  canManage,
}: MembershipListProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleRemove(membershipId: string) {
    startTransition(async () => {
      const result = await removeMemberAction(familyId, membershipId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  function handleRoleChange(membershipId: string, role: InvitableRole) {
    const formData = new FormData();
    formData.set("membershipId", membershipId);
    formData.set("role", role);

    startTransition(async () => {
      const result = await updateMemberRoleAction(familyId, formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("family.noMembers")}</p>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {members.map((member) => {
        const isOwner = member.role === "owner";
        const isSelf = member.user_id === currentUserId;
        const displayName =
          member.profile?.full_name ?? `User ${member.user_id.slice(0, 8)}`;

        return (
          <div
            key={member.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{displayName}</p>
                {isSelf && <Badge variant="secondary">{t("common.you")}</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">
                {t("common.joined", {
                  date: formatDisplayDate(member.created_at) ?? "",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canManage && !isOwner ? (
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    handleRoleChange(member.id, value as InvitableRole)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`family.roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">
                  {t(`family.roles.${member.role}`)}
                </Badge>
              )}

              {canManage && !isOwner && !isSelf && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(member.id)}
                  disabled={isPending}
                >
                  {t("common.remove")}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
