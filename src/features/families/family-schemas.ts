import { z } from "zod";

import { INVITABLE_ROLES } from "@/lib/family/constants";

type FamilyValidationMessages = {
  nameMin: string;
  descriptionTooLong: string;
  email: string;
};

export function createFamilySchema(messages: FamilyValidationMessages) {
  return z.object({
    name: z.string().min(2, messages.nameMin),
    description: z.string().max(1000, messages.descriptionTooLong).optional(),
  });
}

export function createUpdateFamilySchema(messages: FamilyValidationMessages) {
  return createFamilySchema(messages);
}

export function createInviteMemberSchema(messages: FamilyValidationMessages) {
  return z.object({
    email: z.email(messages.email),
    role: z.enum(INVITABLE_ROLES),
  });
}

export const updateMemberRoleSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(INVITABLE_ROLES),
});

export type CreateFamilyInput = z.infer<ReturnType<typeof createFamilySchema>>;
export type UpdateFamilyInput = z.infer<
  ReturnType<typeof createUpdateFamilySchema>
>;
export type InviteMemberInput = z.infer<
  ReturnType<typeof createInviteMemberSchema>
>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
