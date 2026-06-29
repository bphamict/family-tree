"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { uploadPersonAvatarAction } from "@/features/persons/person-actions";
import type { Person } from "@/types/person";

type AvatarUploadFormProps = {
  familyId: string;
  person: Person;
};

export function AvatarUploadForm({ familyId, person }: AvatarUploadFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadPersonAvatarAction(
        familyId,
        person.id,
        formData,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <PersonAvatar person={person} size="lg" />

      <form action={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <div className="grid gap-2">
          <Label htmlFor="avatar">Upload avatar</Label>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Uploading..." : "Upload image"}
        </Button>
      </form>
    </div>
  );
}
