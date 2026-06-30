"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { AvatarForm } from "@/components/shared/avatar-form";
import {
  removeProfileAvatarAction,
  uploadProfileAvatarAction,
} from "@/features/auth/profile-actions";
import type { Profile } from "@/features/auth/profile-service";
import { useTranslations } from "@/lib/i18n/use-translator";

type ProfileAvatarFormProps = {
  profile: Profile;
};

export function ProfileAvatarForm({ profile }: ProfileAvatarFormProps) {
  const t = useTranslations();
  const displayName = profile.full_name?.trim() || t("profile.title");

  return (
    <AvatarForm
      avatarUrl={profile.avatar_url}
      previewAlt={displayName}
      preview={
        <UserAvatar
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          size="lg"
        />
      }
      labels={{
        uploadAvatar: t("profile.uploadAvatar"),
        uploadImage: t("profile.uploadImage"),
        removeAvatar: t("profile.removeAvatar"),
        selectImageError: t("profile.errors.selectImage"),
      }}
      onUpload={uploadProfileAvatarAction}
      onRemove={removeProfileAvatarAction}
    />
  );
}
