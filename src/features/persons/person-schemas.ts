import { z } from "zod";

import { PERSON_GENDERS } from "@/lib/person/constants";

type PersonValidationMessages = {
  firstNameRequired: string;
  lastNameRequired: string;
  validDate: string;
  validYear: string;
  biographyTooLong: string;
  occupationTooLong: string;
  otherNameTooLong: string;
  deathAfterBirth: string;
};

function optionalDate(validDate: string) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, validDate)
    .optional()
    .or(z.literal(""));
}

function personFieldsSchema(messages: PersonValidationMessages) {
  return z.object({
    firstName: z.string().min(1, messages.firstNameRequired),
    middleName: z.string().optional(),
    lastName: z.string().min(1, messages.lastNameRequired),
    otherName: z.string().max(200, messages.otherNameTooLong).optional(),
    gender: z.enum(PERSON_GENDERS).optional(),
    birthDate: optionalDate(messages.validDate),
    deathDate: optionalDate(messages.validDate),
    biography: z.string().max(5000, messages.biographyTooLong).optional(),
    occupation: z.string().max(200, messages.occupationTooLong).optional(),
  });
}

export function createPersonSchema(messages: PersonValidationMessages) {
  return personFieldsSchema(messages).refine(
    (data) => {
      if (!data.birthDate || !data.deathDate) {
        return true;
      }

      return data.deathDate >= data.birthDate;
    },
    {
      message: messages.deathAfterBirth,
      path: ["deathDate"],
    },
  );
}

export function createUpdatePersonSchema(messages: PersonValidationMessages) {
  return createPersonSchema(messages);
}

export function createPersonSearchSchema(messages: PersonValidationMessages) {
  return z.object({
    query: z.string().optional(),
    gender: z.enum(PERSON_GENDERS).optional(),
    birthYear: z
      .string()
      .regex(/^\d{4}$/, messages.validYear)
      .optional()
      .or(z.literal("")),
    deathYear: z
      .string()
      .regex(/^\d{4}$/, messages.validYear)
      .optional()
      .or(z.literal("")),
    occupation: z.string().optional(),
    includeArchived: z.coerce.boolean().optional(),
  });
}

export type CreatePersonInput = z.infer<ReturnType<typeof createPersonSchema>>;
export type UpdatePersonInput = z.infer<
  ReturnType<typeof createUpdatePersonSchema>
>;
export type PersonSearchInput = z.infer<
  ReturnType<typeof createPersonSearchSchema>
>;
