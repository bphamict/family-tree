"use server";

import { revalidatePath } from "next/cache";

import { getFamilyById } from "@/features/families/family-service";
import { getPersonById } from "@/features/persons/person-service";
import { createRelationshipSchema } from "@/features/relationships/relationship-schemas";
import { requireUser } from "@/lib/auth/require-user";
import { canManagePersons } from "@/lib/family/permissions";
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
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    return { error: "You do not have permission to manage relationships." };
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
  const permission = await requireRelationshipManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const subjectPerson = await getPersonById(familyId, subjectPersonId);

  if (!subjectPerson) {
    return { error: "Person not found." };
  }

  const parsed = createRelationshipSchema.safeParse({
    relatedPersonId: formData.get("relatedPersonId"),
    relationshipType: formData.get("relationshipType"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.relatedPersonId === subjectPersonId) {
    return { error: "A person cannot have a relationship with themselves." };
  }

  const relatedPerson = await getPersonById(familyId, parsed.data.relatedPersonId);

  if (!relatedPerson) {
    return { error: "Related person not found in this family." };
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

  return { success: "Relationship added successfully." };
}

export async function deleteRelationshipAction(
  familyId: string,
  subjectPersonId: string,
  relationshipId: string,
): Promise<ActionResult> {
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
    return { error: "Relationship not found." };
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

  return { success: "Relationship removed successfully." };
}
