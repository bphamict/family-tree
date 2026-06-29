import { z } from "zod";

import { EVENT_TYPES } from "@/lib/event/constants";

export const eventFieldsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(5000, "Description is too long").optional(),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  location: z.string().max(200, "Location is too long").optional(),
  participantIds: z.array(z.string().uuid()).optional(),
});

export const createEventSchema = eventFieldsSchema;
export const updateEventSchema = eventFieldsSchema;

export const eventSearchSchema = z.object({
  eventType: z.enum(EVENT_TYPES).optional(),
  year: z
    .string()
    .regex(/^\d{4}$/, "Enter a valid year")
    .optional()
    .or(z.literal("")),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventSearchInput = z.infer<typeof eventSearchSchema>;
