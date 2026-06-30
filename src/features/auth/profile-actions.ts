"use server";

import { revalidatePath } from "next/cache";

import {
  ensureProfile,
  getProfileByUserId,
  updateProfile,
} from "@/features/auth/profile-service";
import { createUpdateProfileSchema } from "@/features/auth/profile-schemas";
import { requireUser } from "@/lib/auth/require-user";
import { PROFILE_AVATARS_BUCKET } from "@/lib/auth/constants";
import { getTranslations } from "@/lib/i18n/translator";
import { getAuthValidationMessages } from "@/lib/i18n/validation-messages";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
};

async function ensureProfileExists(
  userId: string,
  fallbackName: string,
): Promise<void> {
  await ensureProfile(userId, fallbackName);
}

export async function updateProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const user = await requireUser();
  const validationMessages = getAuthValidationMessages(t);

  const parsed = createUpdateProfileSchema(validationMessages).safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  try {
    await ensureProfileExists(user.id, user.email ?? "User");

    const existing = await getProfileByUserId(user.id);

    if (!existing) {
      return { error: t("profile.errors.notFound") };
    }

    await updateProfile(user.id, {
      full_name: parsed.data.fullName,
    });
  } catch {
    return { error: t("profile.errors.update") };
  }

  revalidatePath("/profile");
  revalidatePath("/families");

  return { success: t("profile.toast.updated") };
}

export async function uploadProfileAvatarAction(
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const user = await requireUser();

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: t("profile.errors.selectImage") };
  }

  try {
    await ensureProfileExists(user.id, user.email ?? "User");
  } catch {
    return { error: t("profile.errors.update") };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${user.id}/avatar.${extension}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_AVATARS_BUCKET).getPublicUrl(storagePath);

  try {
    await updateProfile(user.id, {
      avatar_url: publicUrl,
    });
  } catch {
    return { error: t("profile.errors.update") };
  }

  revalidatePath("/profile");
  revalidatePath("/families");

  return { success: t("profile.toast.avatarUploaded") };
}

export async function removeProfileAvatarAction(): Promise<ActionResult> {
  const t = await getTranslations();
  const user = await requireUser();
  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    return { error: t("profile.errors.notFound") };
  }

  if (!profile.avatar_url) {
    return { error: t("profile.errors.noAvatar") };
  }

  const supabase = await createClient();
  const { data: files } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .list(user.id);

  if (files?.length) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_AVATARS_BUCKET)
      .remove(files.map((file) => `${user.id}/${file.name}`));

    if (removeError) {
      return { error: removeError.message };
    }
  }

  try {
    await updateProfile(user.id, { avatar_url: null });
  } catch {
    return { error: t("profile.errors.update") };
  }

  revalidatePath("/profile");
  revalidatePath("/families");

  return { success: t("profile.toast.avatarRemoved") };
}
