"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createFamilySchema,
  createInviteMemberSchema,
  createUpdateFamilySchema,
  updateMemberRoleSchema,
} from "@/features/families/family-schemas";
import { getFamilyById } from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";
import { ACTIVE_FAMILY_COOKIE } from "@/lib/family/constants";
import {
  canArchiveFamily,
  canInviteMembers,
  canManageFamily,
  canManageMembers,
} from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import { getFamilyValidationMessages } from "@/lib/i18n/validation-messages";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
  familyId?: string;
};

export async function createFamilyAction(
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getFamilyValidationMessages(t);
  await requireUser();
  const parsed = createFamilySchema(validationMessages).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const { data: familyId, error } = await supabase.rpc(
    "create_family_with_owner",
    {
      p_name: parsed.data.name,
      p_description: parsed.data.description ?? null,
    },
  );

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FAMILY_COOKIE, familyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/families");
  redirect(`/families/${familyId}`);
}

export async function updateFamilyAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getFamilyValidationMessages(t);
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageFamily(family.membership.role)) {
    return { error: t("family.errors.update") };
  }

  const parsed = createUpdateFamilySchema(validationMessages).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .eq("id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}`);
  revalidatePath("/families");
  return { success: t("family.toast.updated") };
}

export async function archiveFamilyAction(
  familyId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canArchiveFamily(family.membership.role)) {
    return { error: t("family.errors.archive") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}`);
  revalidatePath("/families");
  return { success: t("family.toast.archived") };
}

export async function restoreFamilyAction(
  familyId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canArchiveFamily(family.membership.role)) {
    return { error: t("family.errors.restore") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ archived_at: null })
    .eq("id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}`);
  revalidatePath("/families");
  return { success: t("family.toast.restored") };
}

export async function inviteMemberAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const validationMessages = getFamilyValidationMessages(t);
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canInviteMembers(family.membership.role)) {
    return { error: t("family.errors.invite") };
  }

  const parsed = createInviteMemberSchema(validationMessages).safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("errors.notAuthenticated") };
  }

  const email = parsed.data.email.toLowerCase();

  const { data: isExistingMember, error: memberCheckError } =
    await supabase.rpc("is_family_member_by_email", {
      p_family_id: familyId,
      p_email: email,
    });

  if (memberCheckError) {
    return { error: memberCheckError.message };
  }

  if (isExistingMember) {
    return { error: t("family.errors.memberAlreadyExists") };
  }

  const { data: existingInvitation, error: lookupError } = await supabase
    .from("family_invitations")
    .select("id, accepted_at, expires_at")
    .eq("family_id", familyId)
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (existingInvitation) {
    const isPending =
      !existingInvitation.accepted_at &&
      new Date(existingInvitation.expires_at) > new Date();

    if (isPending) {
      return { error: t("family.errors.invitationAlreadyPending") };
    }

    const { error: deleteError } = await supabase
      .from("family_invitations")
      .delete()
      .eq("id", existingInvitation.id);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  const { error } = await supabase.from("family_invitations").insert({
    family_id: familyId,
    email,
    role: parsed.data.role,
    invited_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}/members`);

  return { success: t("family.toast.invitationSent") };
}

export async function removeMemberAction(
  familyId: string,
  membershipId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageMembers(family.membership.role)) {
    return { error: t("family.errors.removeMember") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}/members`);

  return { success: t("family.toast.memberRemoved") };
}

export async function updateMemberRoleAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageMembers(family.membership.role)) {
    return { error: t("family.errors.updateRole") };
  }

  const parsed = updateMemberRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? t("errors.invalidInput"),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .eq("family_id", familyId)
    .neq("role", "owner");

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}/members`);

  return { success: t("family.toast.roleUpdated") };
}

export async function cancelInvitationAction(
  familyId: string,
  invitationId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canInviteMembers(family.membership.role)) {
    return { error: t("family.errors.cancelInvitation") };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("family_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}/members`);

  return { success: t("family.toast.invitationCancelled") };
}

export async function acceptInvitationAction(
  token: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();

  const supabase = await createClient();
  const { data: familyId, error } = await supabase.rpc(
    "accept_family_invitation",
    { p_token: token },
  );

  if (error) {
    return { error: error.message };
  }

  if (!familyId) {
    return { error: t("family.errors.acceptInvitation") };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FAMILY_COOKIE, familyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/families");
  revalidatePath(`/families/${familyId}`);

  return {
    success: t("family.toast.invitationAccepted"),
    familyId,
  };
}

export async function declineInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const t = await getTranslations();
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("family_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/families");

  return { success: t("family.toast.invitationDeclined") };
}
