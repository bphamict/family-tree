import { z } from "zod";

import { PERSON_GENDERS } from "@/lib/person/constants";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .optional()
  .or(z.literal(""));

const personFieldsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(PERSON_GENDERS).optional(),
  birthDate: optionalDate,
  deathDate: optionalDate,
  biography: z.string().max(5000, "Biography is too long").optional(),
  occupation: z.string().max(200, "Occupation is too long").optional(),
});

export const createPersonSchema = personFieldsSchema.refine(
  (data) => {
    if (!data.birthDate || !data.deathDate) {
      return true;
    }

    return data.deathDate >= data.birthDate;
  },
  {
    message: "Death date must be on or after birth date",
    path: ["deathDate"],
  },
);

export const updatePersonSchema = createPersonSchema;

export const personSearchSchema = z.object({
  query: z.string().optional(),
  gender: z.enum(PERSON_GENDERS).optional(),
  birthYear: z
    .string()
    .regex(/^\d{4}$/, "Enter a valid year")
    .optional()
    .or(z.literal("")),
  deathYear: z
    .string()
    .regex(/^\d{4}$/, "Enter a valid year")
    .optional()
    .or(z.literal("")),
  occupation: z.string().optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type PersonSearchInput = z.infer<typeof personSearchSchema>;
