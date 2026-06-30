"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProfileAvatarAction } from "@/features/auth/profile-actions";
import type { Profile } from "@/features/auth/profile-service";
import { useTranslations } from "@/lib/i18n/use-translator";

type ProfileAvatarFormProps = {
  profile: Profile;
};

export function ProfileAvatarForm({ profile }: ProfileAvatarFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadProfileAvatarAction(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <UserAvatar
        fullName={profile.full_name}
        avatarUrl={profile.avatar_url}
        size="lg"
      />

      <form
        action={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <div className="grid gap-2">
          <Label htmlFor="avatar">{t("profile.uploadAvatar")}</Label>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("common.uploading") : t("profile.uploadImage")}
        </Button>
      </form>
    </div>
  );
}
