import { z } from "zod";

type ProfileValidationMessages = {
  nameMin: string;
};

export function createUpdateProfileSchema(messages: ProfileValidationMessages) {
  return z.object({
    fullName: z.string().min(2, messages.nameMin),
  });
}

export type UpdateProfileInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
