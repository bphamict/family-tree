import { z } from "zod";

import { CREATE_RELATIONSHIP_TYPES } from "@/lib/relationship/constants";

type RelationshipValidationMessages = {
  selectPerson: string;
  validDate: string;
  endAfterStart: string;
};

function optionalDate(validDate: string) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, validDate)
    .optional()
    .or(z.literal(""));
}

export function createRelationshipSchema(
  messages: RelationshipValidationMessages,
) {
  return z
    .object({
      relatedPersonId: z.uuid(messages.selectPerson),
      relationshipType: z.enum(CREATE_RELATIONSHIP_TYPES),
      startDate: optionalDate(messages.validDate),
      endDate: optionalDate(messages.validDate),
    })
    .refine(
      (data) => {
        if (!data.startDate || !data.endDate) {
          return true;
        }

        return data.endDate >= data.startDate;
      },
      {
        message: messages.endAfterStart,
        path: ["endDate"],
      },
    );
}

export type CreateRelationshipInput = z.infer<
  ReturnType<typeof createRelationshipSchema>
>;
