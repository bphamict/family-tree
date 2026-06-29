import { z } from "zod";

import { CREATE_RELATIONSHIP_TYPES } from "@/lib/relationship/constants";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .optional()
  .or(z.literal(""));

export const createRelationshipSchema = z
  .object({
    relatedPersonId: z.uuid("Select a person"),
    relationshipType: z.enum(CREATE_RELATIONSHIP_TYPES),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.endDate >= data.startDate;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    },
  );

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
