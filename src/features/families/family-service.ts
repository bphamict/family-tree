import { createClient } from "@/lib/supabase/server";
import type {
  Family,
  FamilyInvitation,
  FamilyRole,
  FamilyWithMembership,
  InvitableRole,
  Membership,
  MembershipWithProfile,
} from "@/types/family";

export async function getUserFamilies(
  userId: string,
): Promise<FamilyWithMembership[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, family_id, user_id, role, created_at, updated_at, family:families(id, name, description, archived_at, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row) => row.family !== null)
    .map((row) => {
      const family = row.family as Family;

      return {
        ...family,
        membership: {
          id: row.id,
          family_id: row.family_id,
          user_id: row.user_id,
          role: row.role as FamilyRole,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    });
}

export async function getFamilyById(
  familyId: string,
): Promise<FamilyWithMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, family_id, user_id, role, created_at, updated_at, family:families(id, name, description, archived_at, created_at, updated_at)",
    )
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.family) {
    return null;
  }

  const family = data.family as Family;

  return {
    ...family,
    membership: {
      id: data.id,
      family_id: data.family_id,
      user_id: data.user_id,
      role: data.role as FamilyRole,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  };
}

export async function getFamilyMembers(
  familyId: string,
): Promise<MembershipWithProfile[]> {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("id, family_id, user_id, role, created_at, updated_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!memberships?.length) {
    return [];
  }

  const userIds = memberships.map((membership) => membership.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .in("user_id", userIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return memberships.map((membership) => ({
    ...membership,
    role: membership.role as FamilyRole,
    profile: profileMap.get(membership.user_id) ?? null,
    email: null,
  }));
}

export async function getFamilyInvitations(
  familyId: string,
): Promise<FamilyInvitation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_invitations")
    .select(
      "id, family_id, email, role, invited_by, token, expires_at, accepted_at, created_at",
    )
    .eq("family_id", familyId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((invitation) => ({
    ...invitation,
    role: invitation.role as InvitableRole,
  }));
}

export async function getPendingInvitationsForEmail(
  email: string,
): Promise<Array<FamilyInvitation & { family: Family }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_invitations")
    .select(
      "id, family_id, email, role, invited_by, token, expires_at, accepted_at, created_at, family:families(id, name, description, archived_at, created_at, updated_at)",
    )
    .ilike("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row) => row.family !== null)
    .map((row) => ({
      id: row.id,
      family_id: row.family_id,
      email: row.email,
      role: row.role as InvitableRole,
      invited_by: row.invited_by,
      token: row.token,
      expires_at: row.expires_at,
      accepted_at: row.accepted_at,
      created_at: row.created_at,
      family: row.family as Family,
    }));
}

export async function getMembershipForUser(
  familyId: string,
  userId: string,
): Promise<Membership | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("id, family_id, user_id, role, created_at, updated_at")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        ...data,
        role: data.role as FamilyRole,
      }
    : null;
}
