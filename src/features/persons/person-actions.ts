"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFamilyById } from "@/features/families/family-service";
import {
  createPersonSchema,
  updatePersonSchema,
} from "@/features/persons/person-schemas";
import { getPersonById } from "@/features/persons/person-service";
import { requireUser } from "@/lib/auth/require-user";
import { canManagePersons } from "@/lib/family/permissions";
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
    gender: input.gender || null,
    birth_date: input.birthDate || null,
    death_date: input.deathDate || null,
    biography: input.biography || null,
    occupation: input.occupation || null,
  };
}

async function requirePersonManagement(familyId: string) {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    return { error: "You do not have permission to manage persons." };
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
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const parsed = createPersonSchema.safeParse(parsePersonFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const parsed = updatePersonSchema.safeParse(parsePersonFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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

  return { success: "Person updated successfully." };
}

export async function archivePersonAction(
  familyId: string,
  personId: string,
): Promise<ActionResult> {
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

  return { success: "Person archived successfully." };
}

export async function restorePersonAction(
  familyId: string,
  personId: string,
): Promise<ActionResult> {
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

  return { success: "Person restored successfully." };
}

export async function uploadPersonAvatarAction(
  familyId: string,
  personId: string,
  formData: FormData,
): Promise<ActionResult> {
  const permission = await requirePersonManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const person = await getPersonById(familyId, personId);

  if (!person) {
    return { error: "Person not found." };
  }

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select an image file." };
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

  return { success: "Avatar uploaded successfully." };
}
