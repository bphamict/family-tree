"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createFamilySchema,
  inviteMemberSchema,
  updateFamilySchema,
  updateMemberRoleSchema,
} from "@/features/families/family-schemas";
import {
  getFamilyById,
  getMembershipForUser,
} from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";
import { ACTIVE_FAMILY_COOKIE } from "@/lib/family/constants";
import {
  canArchiveFamily,
  canInviteMembers,
  canManageFamily,
  canManageMembers,
} from "@/lib/family/permissions";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
};

export async function createFamilyAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const parsed = createFamilySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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

  revalidatePath("/dashboard");
  revalidatePath("/families");
  redirect(`/families/${familyId}`);
}

export async function updateFamilyAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageFamily(family.membership.role)) {
    return { error: "You do not have permission to update this family." };
  }

  const parsed = updateFamilySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  revalidatePath("/dashboard");

  return { success: "Family updated successfully." };
}

export async function archiveFamilyAction(
  familyId: string,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canArchiveFamily(family.membership.role)) {
    return { error: "You do not have permission to archive this family." };
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
  revalidatePath("/dashboard");

  return { success: "Family archived successfully." };
}

export async function restoreFamilyAction(
  familyId: string,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canArchiveFamily(family.membership.role)) {
    return { error: "You do not have permission to restore this family." };
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
  revalidatePath("/dashboard");

  return { success: "Family restored successfully." };
}

export async function setActiveFamilyAction(familyId: string): Promise<void> {
  const user = await requireUser();
  const membership = await getMembershipForUser(familyId, user.id);

  if (!membership) {
    throw new Error("You are not a member of this family.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FAMILY_COOKIE, familyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/dashboard");
  revalidatePath("/families");
}

export async function inviteMemberAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canInviteMembers(family.membership.role)) {
    return { error: "You do not have permission to invite members." };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase.from("family_invitations").insert({
    family_id: familyId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/families/${familyId}/members`);

  return { success: "Invitation sent successfully." };
}

export async function removeMemberAction(
  familyId: string,
  membershipId: string,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageMembers(family.membership.role)) {
    return { error: "You do not have permission to remove members." };
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

  return { success: "Member removed successfully." };
}

export async function updateMemberRoleAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageMembers(family.membership.role)) {
    return { error: "You do not have permission to update member roles." };
  }

  const parsed = updateMemberRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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

  return { success: "Member role updated successfully." };
}

export async function cancelInvitationAction(
  familyId: string,
  invitationId: string,
): Promise<ActionResult> {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canInviteMembers(family.membership.role)) {
    return { error: "You do not have permission to cancel invitations." };
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

  return { success: "Invitation cancelled." };
}

export async function acceptInvitationAction(
  token: string,
): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { data: familyId, error } = await supabase.rpc(
    "accept_family_invitation",
    { p_token: token },
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

  revalidatePath("/dashboard");
  revalidatePath("/families");
  redirect(`/families/${familyId}`);
}

export async function declineInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("family_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/families");

  return { success: "Invitation declined." };
}
