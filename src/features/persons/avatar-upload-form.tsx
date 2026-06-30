"use client";

import { PersonAvatar } from "@/components/shared/person-avatar";
import { AvatarForm } from "@/components/shared/avatar-form";
import {
  removePersonAvatarAction,
  uploadPersonAvatarAction,
} from "@/features/persons/person-actions";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { Person } from "@/types/person";
import { formatPersonName } from "@/types/person";

type AvatarUploadFormProps = {
  familyId: string;
  person: Person;
};

export function AvatarUploadForm({ familyId, person }: AvatarUploadFormProps) {
  const t = useTranslations();
  const personName = formatPersonName(person);

  return (
    <AvatarForm
      avatarUrl={person.avatar_url}
      previewAlt={personName}
      preview={<PersonAvatar person={person} size="lg" />}
      labels={{
        uploadAvatar: t("person.uploadAvatar"),
        uploadImage: t("person.uploadImage"),
        removeAvatar: t("person.removeAvatar"),
        selectImageError: t("person.errors.selectImage"),
      }}
      onUpload={(formData) =>
        uploadPersonAvatarAction(familyId, person.id, formData)
      }
      onRemove={() => removePersonAvatarAction(familyId, person.id)}
    />
  );
}
