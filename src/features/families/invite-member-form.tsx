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
import { INVITABLE_ROLES, ROLE_LABELS } from "@/lib/family/constants";
import type { InvitableRole } from "@/types/family";

type InviteMemberFormProps = {
  familyId: string;
};

export function InviteMemberForm({ familyId }: InviteMemberFormProps) {
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
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="member@example.com"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
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
                {ROLE_LABELS[invitableRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send invitation"}
      </Button>
    </form>
  );
}
