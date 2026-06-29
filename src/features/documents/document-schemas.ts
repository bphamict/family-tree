import { z } from "zod";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/document/constants";

type DocumentValidationMessages = {
  titleRequired: string;
  titleTooLong: string;
  descriptionTooLong: string;
  unsupportedType: string;
  fileRequired: string;
  fileTooLarge: string;
};

const optionalUuid = z.string().uuid().optional().or(z.literal(""));

function documentMetadataSchema(messages: DocumentValidationMessages) {
  return z.object({
    title: z
      .string()
      .min(1, messages.titleRequired)
      .max(200, messages.titleTooLong),
    description: z.string().max(5000, messages.descriptionTooLong).optional(),
    personId: optionalUuid,
    eventId: optionalUuid,
  });
}

export function createUploadDocumentSchema(
  messages: DocumentValidationMessages,
) {
  return documentMetadataSchema(messages).extend({
    mimeType: z
      .string()
      .refine((value) => ALLOWED_DOCUMENT_MIME_TYPES.has(value), {
        message: messages.unsupportedType,
      }),
    fileSize: z
      .number()
      .int()
      .positive(messages.fileRequired)
      .max(MAX_DOCUMENT_SIZE_BYTES, messages.fileTooLarge),
  });
}

export const documentSearchSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  personId: optionalUuid,
  eventId: optionalUuid,
});

export type DocumentMetadataInput = z.infer<
  ReturnType<typeof documentMetadataSchema>
>;
export type UploadDocumentInput = z.infer<
  ReturnType<typeof createUploadDocumentSchema>
>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
