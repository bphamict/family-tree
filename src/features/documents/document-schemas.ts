import { z } from "zod";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/document/constants";

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(""));

export const documentMetadataSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(5000, "Description is too long").optional(),
  personId: optionalUuid,
  eventId: optionalUuid,
});

export const uploadDocumentSchema = documentMetadataSchema.extend({
  mimeType: z
    .string()
    .refine((value) => ALLOWED_DOCUMENT_MIME_TYPES.has(value), {
      message: "Unsupported file type",
    }),
  fileSize: z
    .number()
    .int()
    .positive("File is required")
    .max(MAX_DOCUMENT_SIZE_BYTES, "File is too large (max 50 MB)"),
});

export const documentSearchSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  personId: optionalUuid,
  eventId: optionalUuid,
});

export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
