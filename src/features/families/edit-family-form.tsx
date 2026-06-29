"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveFamilyAction,
  restoreFamilyAction,
  updateFamilyAction,
} from "@/features/families/family-actions";
import type { FamilyWithMembership } from "@/types/family";

type EditFamilyFormProps = {
  family: FamilyWithMembership;
  canManage: boolean;
  canArchive: boolean;
};

export function EditFamilyForm({
  family,
  canManage,
  canArchive,
}: EditFamilyFormProps) {
  const [isPending, startTransition] = useTransition();
  const isArchived = Boolean(family.archived_at);

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateFamilyAction(family.id, formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = isArchived
        ? await restoreFamilyAction(family.id)
        : await archiveFamilyAction(family.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={handleUpdate} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Family name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={family.name}
            required
            disabled={!canManage || isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={family.description ?? ""}
            disabled={!canManage || isPending}
          />
        </div>

        {canManage && (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        )}
      </form>

      {canArchive && (
        <Button
          type="button"
          variant={isArchived ? "outline" : "destructive"}
          onClick={handleArchive}
          disabled={isPending}
        >
          {isArchived ? "Restore family" : "Archive family"}
        </Button>
      )}
    </div>
  );
}
