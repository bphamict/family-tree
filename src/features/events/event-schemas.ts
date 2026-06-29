import { z } from "zod";

import { EVENT_TYPES } from "@/lib/event/constants";

type EventValidationMessages = {
  titleRequired: string;
  titleTooLong: string;
  descriptionTooLong: string;
  locationTooLong: string;
  validDate: string;
  validYear: string;
};

function eventFieldsSchema(messages: EventValidationMessages) {
  return z.object({
    title: z
      .string()
      .min(1, messages.titleRequired)
      .max(200, messages.titleTooLong),
    description: z.string().max(5000, messages.descriptionTooLong).optional(),
    eventType: z.enum(EVENT_TYPES),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, messages.validDate),
    location: z.string().max(200, messages.locationTooLong).optional(),
    participantIds: z.array(z.string().uuid()).optional(),
  });
}

export function createEventSchema(messages: EventValidationMessages) {
  return eventFieldsSchema(messages);
}

export function createUpdateEventSchema(messages: EventValidationMessages) {
  return eventFieldsSchema(messages);
}

export function createEventSearchSchema(messages: EventValidationMessages) {
  return z.object({
    eventType: z.enum(EVENT_TYPES).optional(),
    year: z
      .string()
      .regex(/^\d{4}$/, messages.validYear)
      .optional()
      .or(z.literal("")),
  });
}

export type CreateEventInput = z.infer<ReturnType<typeof createEventSchema>>;
export type UpdateEventInput = z.infer<
  ReturnType<typeof createUpdateEventSchema>
>;
export type EventSearchInput = z.infer<
  ReturnType<typeof createEventSearchSchema>
>;
