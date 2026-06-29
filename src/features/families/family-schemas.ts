import { z } from "zod";

import { INVITABLE_ROLES } from "@/lib/family/constants";

export const createFamilySchema = z.object({
  name: z.string().min(2, "Family name must be at least 2 characters"),
  description: z.string().max(1000, "Description is too long").optional(),
});

export const updateFamilySchema = z.object({
  name: z.string().min(2, "Family name must be at least 2 characters"),
  description: z.string().max(1000, "Description is too long").optional(),
});

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(INVITABLE_ROLES),
});

export const updateMemberRoleSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(INVITABLE_ROLES),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
