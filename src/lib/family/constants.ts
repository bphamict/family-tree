import type { FamilyRole, InvitableRole } from "@/types/family";

export const FAMILY_ROLES: FamilyRole[] = [
  "owner",
  "admin",
  "editor",
  "viewer",
];

export const INVITABLE_ROLES: InvitableRole[] = ["admin", "editor", "viewer"];

export const ACTIVE_FAMILY_COOKIE = "active_family_id";

export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};
