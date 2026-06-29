export type FamilyRole = "owner" | "admin" | "editor" | "viewer";

export type InvitableRole = "admin" | "editor" | "viewer";

export type Family = {
  id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  created_at: string;
  updated_at: string;
};

export type FamilyInvitation = {
  id: string;
  family_id: string;
  email: string;
  role: InvitableRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type FamilyWithMembership = Family & {
  membership: Membership;
};

export type MembershipWithProfile = Membership & {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  email: string | null;
};
