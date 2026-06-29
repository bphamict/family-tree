"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFamilyById } from "@/features/families/family-service";
import {
  createPersonSchema,
  createUpdatePersonSchema,
} from "@/features/persons/person-schemas";
import { getPersonById } from "@/features/persons/person-service";
import { requireUser } from "@/lib/auth/require-user";
import { canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import { getPersonValidationMessages } from "@/lib/i18n/validation-messages";
import { PERSON_AVATARS_BUCKET } from "@/lib/person/constants";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
};

function parsePersonFormData(formData: FormData) {
  return {
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
    otherName: formData.get("otherName") || undefined,
    gender: formData.get("gender") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    deathDate: formData.get("deathDate") || undefined,
    biography: formData.get("biography") || undefined,
    occupation: formData.get("occupation") || undefined,
  };
}

function toPersonPayload(input: {
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  gender?: string;
  birthDate?: string;
  deathDate?: string;
  biography?: string;
  occupation?: string;
}) {
  return {
    first_name: input.firstName,
    middle_name: input.middleName || null,
    last_name: input.lastName,
    other_name: input.otherName || null,
    gender: input.gender || null,
    birth_date: input.birthDate || null,
    death_date: input.deathDate || null,
    biography: input.biography || null,
    occupation: input.occupation || null,
  };
}

async function requirePersonManagement(familyId: string) {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    return { error: t("person.errors.manage") };
  }

  return { family };
}

function revalidatePersonPaths(familyId: string, personId?: string) {
  revalidatePath(`/families/${familyId}/persons`);
  revalidatePath(`/families/${familyId}`);

  if (personId) {
    revalidatePath(`/families/${familyId}/persons/${personId}`);
    revalidatePath(`/families/${familyId}/persons/${personId}/edit`);
  }
}

export async function createPersonAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getPersonValidationMessages(t);
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const parsed = createPersonSchema(validationMessages).safeParse(
    parsePersonFormData(formData),
  );

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("persons")
    .insert({
      family_id: familyId,
      ...toPersonPayload(parsed.data),
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePersonPaths(familyId, data.id);
  redirect(`/families/${familyId}/persons/${data.id}`);
}

export async function updatePersonAction(
  familyId: string,
  personId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getPersonValidationMessages(t);
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const parsed = createUpdatePersonSchema(validationMessages).safeParse(
    parsePersonFormData(formData),
  );

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("persons")
    .update(toPersonPayload(parsed.data))
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePersonPaths(familyId, personId);

  return { success: t("person.toast.updated") };
}

export async function archivePersonAction(
  familyId: string,
  personId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("persons")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePersonPaths(familyId, personId);

  return { success: t("person.toast.archived") };
}

export async function restorePersonAction(
  familyId: string,
  personId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("persons")
    .update({ archived_at: null })
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePersonPaths(familyId, personId);

  return { success: t("person.toast.restored") };
}

export async function uploadPersonAvatarAction(
  familyId: string,
  personId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const person = await getPersonById(familyId, personId);

  if (!person) {
    return { error: t("person.errors.notFound") };
  }

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: t("person.errors.selectImage") };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${familyId}/${personId}/avatar.${extension}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(PERSON_AVATARS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PERSON_AVATARS_BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("persons")
    .update({ avatar_url: publicUrl })
    .eq("id", personId)
    .eq("family_id", familyId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePersonPaths(familyId, personId);

  return { success: t("person.toast.avatarUploaded") };
}
