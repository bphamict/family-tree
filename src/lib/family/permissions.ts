import type { FamilyRole } from "@/types/family";

export function canManageFamily(role: FamilyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canInviteMembers(role: FamilyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: FamilyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canArchiveFamily(role: FamilyRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewPersons(): boolean {
  return true;
}

export function canManagePersons(role: FamilyRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canViewEvents(): boolean {
  return true;
}

export function canManageEvents(role: FamilyRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canViewDocuments(): boolean {
  return true;
}

export function canExportData(): boolean {
  return true;
}

export function canManageDocuments(role: FamilyRole): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}
