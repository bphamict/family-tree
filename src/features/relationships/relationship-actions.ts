"use server";

import { revalidatePath } from "next/cache";

import { getFamilyById } from "@/features/families/family-service";
import { getPersonById } from "@/features/persons/person-service";
import { createRelationshipSchema } from "@/features/relationships/relationship-schemas";
import { requireUser } from "@/lib/auth/require-user";
import { canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import { getRelationshipValidationMessages } from "@/lib/i18n/validation-messages";
import { createClient } from "@/lib/supabase/server";
import type { CreateRelationshipType } from "@/lib/relationship/constants";
import type { RelationshipType } from "@/types/relationship";

type ActionResult = {
  error?: string;
  success?: string;
};

function revalidatePersonRelationshipPaths(
  familyId: string,
  personId: string,
  relatedPersonId?: string,
) {
  revalidatePath(`/families/${familyId}/persons/${personId}`);

  if (relatedPersonId) {
    revalidatePath(`/families/${familyId}/persons/${relatedPersonId}`);
  }
}

async function requireRelationshipManagement(familyId: string) {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    return { error: t("relationship.errors.manage") };
  }

  return { family };
}

function resolveRelationshipEndpoints(
  subjectPersonId: string,
  relatedPersonId: string,
  relationshipType: CreateRelationshipType,
): {
  person1Id: string;
  person2Id: string;
  relationshipType: RelationshipType | "child";
} {
  if (relationshipType === "parent") {
    return {
      person1Id: relatedPersonId,
      person2Id: subjectPersonId,
      relationshipType: "parent",
    };
  }

  if (relationshipType === "adoptive_parent") {
    return {
      person1Id: relatedPersonId,
      person2Id: subjectPersonId,
      relationshipType: "adoptive_parent",
    };
  }

  if (relationshipType === "adopted_child") {
    return {
      person1Id: subjectPersonId,
      person2Id: relatedPersonId,
      relationshipType: "adoptive_parent",
    };
  }

  if (relationshipType === "child") {
    return {
      person1Id: relatedPersonId,
      person2Id: subjectPersonId,
      relationshipType: "child",
    };
  }

  if (relationshipType === "guardian") {
    return {
      person1Id: relatedPersonId,
      person2Id: subjectPersonId,
      relationshipType: "guardian",
    };
  }

  return {
    person1Id: subjectPersonId,
    person2Id: relatedPersonId,
    relationshipType: "spouse",
  };
}

export async function createRelationshipAction(
  familyId: string,
  subjectPersonId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getRelationshipValidationMessages(t);
  const permission = await requireRelationshipManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const subjectPerson = await getPersonById(familyId, subjectPersonId);

  if (!subjectPerson) {
    return { error: t("person.errors.notFound") };
  }

  const parsed = createRelationshipSchema(validationMessages).safeParse({
    relatedPersonId: formData.get("relatedPersonId"),
    relationshipType: formData.get("relationshipType"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  if (parsed.data.relatedPersonId === subjectPersonId) {
    return { error: t("relationship.errors.self") };
  }

  const relatedPerson = await getPersonById(
    familyId,
    parsed.data.relatedPersonId,
  );

  if (!relatedPerson) {
    return { error: t("relationship.errors.relatedNotFound") };
  }

  const endpoints = resolveRelationshipEndpoints(
    subjectPersonId,
    parsed.data.relatedPersonId,
    parsed.data.relationshipType,
  );

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_relationship", {
    p_person1_id: endpoints.person1Id,
    p_person2_id: endpoints.person2Id,
    p_relationship_type: endpoints.relationshipType,
    p_start_date: parsed.data.startDate || null,
    p_end_date: parsed.data.endDate || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePersonRelationshipPaths(
    familyId,
    subjectPersonId,
    parsed.data.relatedPersonId,
  );
  revalidatePath(`/families/${familyId}/tree`);

  return { success: t("relationship.toast.added") };
}

export async function deleteRelationshipAction(
  familyId: string,
  subjectPersonId: string,
  relationshipId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requireRelationshipManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const supabase = await createClient();

  const { data: relationship, error: fetchError } = await supabase
    .from("relationships")
    .select("id, person1_id, person2_id")
    .eq("id", relationshipId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!relationship) {
    return { error: t("relationship.errors.notFound") };
  }

  const { error } = await supabase
    .from("relationships")
    .delete()
    .eq("id", relationshipId);

  if (error) {
    return { error: error.message };
  }

  const relatedPersonId =
    relationship.person1_id === subjectPersonId
      ? relationship.person2_id
      : relationship.person1_id;

  revalidatePersonRelationshipPaths(familyId, subjectPersonId, relatedPersonId);
  revalidatePath(`/families/${familyId}/tree`);

  return { success: t("relationship.toast.removed") };
}

export async function reorderChildBirthOrderAction(
  familyId: string,
  parentPersonId: string,
  relationshipId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requireRelationshipManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const supabase = await createClient();

  const { data: siblings, error: siblingsError } = await supabase
    .from("relationships")
    .select("id, person1_id, person2_id, birth_order, relationship_type")
    .eq("person1_id", parentPersonId)
    .in("relationship_type", ["parent", "adoptive_parent", "guardian"])
    .order("birth_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (siblingsError) {
    return { error: siblingsError.message };
  }

  const orderedSiblings = siblings ?? [];
  const currentIndex = orderedSiblings.findIndex(
    (relationship) => relationship.id === relationshipId,
  );

  if (currentIndex === -1) {
    return { error: t("relationship.errors.notFound") };
  }

  const normalizedSiblings = orderedSiblings.map((relationship, index) => ({
    ...relationship,
    birth_order: relationship.birth_order ?? index + 1,
  }));

  for (const relationship of normalizedSiblings) {
    if (
      orderedSiblings.find((item) => item.id === relationship.id)
        ?.birth_order === null
    ) {
      const { error: normalizeError } = await supabase
        .from("relationships")
        .update({ birth_order: relationship.birth_order })
        .eq("id", relationship.id);

      if (normalizeError) {
        return { error: normalizeError.message };
      }
    }
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const targetRelationship = normalizedSiblings[targetIndex];

  if (!targetRelationship) {
    return { error: t("relationship.errors.reorderBoundary") };
  }

  const currentRelationship = normalizedSiblings[currentIndex];
  const currentOrder = currentRelationship.birth_order;
  const targetOrder = targetRelationship.birth_order;

  const { error: currentUpdateError } = await supabase
    .from("relationships")
    .update({ birth_order: targetOrder })
    .eq("id", currentRelationship.id);

  if (currentUpdateError) {
    return { error: currentUpdateError.message };
  }

  const { error: targetUpdateError } = await supabase
    .from("relationships")
    .update({ birth_order: currentOrder })
    .eq("id", targetRelationship.id);

  if (targetUpdateError) {
    return { error: targetUpdateError.message };
  }

  revalidatePersonRelationshipPaths(
    familyId,
    parentPersonId,
    targetRelationship.person2_id,
  );
  revalidatePath(`/families/${familyId}/tree`);

  return { success: t("relationship.toast.reordered") };
}
