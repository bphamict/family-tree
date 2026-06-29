"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFamilyById } from "@/features/families/family-service";
import {
  createEventSchema,
  updateEventSchema,
} from "@/features/events/event-schemas";
import { getEventById } from "@/features/events/event-service";
import { requireUser } from "@/lib/auth/require-user";
import { canManageEvents } from "@/lib/family/permissions";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
};

function parseEventFormData(formData: FormData) {
  const participantIds = formData
    .getAll("participantIds")
    .filter((value): value is string => typeof value === "string");

  return {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventType: formData.get("eventType"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location") || undefined,
    participantIds,
  };
}

function toEventPayload(input: {
  title: string;
  description?: string;
  eventType: string;
  eventDate: string;
  location?: string;
}) {
  return {
    title: input.title,
    description: input.description || null,
    event_type: input.eventType,
    event_date: input.eventDate,
    location: input.location || null,
  };
}

async function requireEventManagement(familyId: string) {
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageEvents(family.membership.role)) {
    return { error: "You do not have permission to manage events." };
  }

  return { family };
}

function revalidateEventPaths(
  familyId: string,
  options: { eventId?: string; personIds?: string[] } = {},
) {
  revalidatePath(`/families/${familyId}/timeline`);
  revalidatePath(`/families/${familyId}`);

  if (options.eventId) {
    revalidatePath(`/families/${familyId}/events/${options.eventId}/edit`);
  }

  for (const personId of options.personIds ?? []) {
    revalidatePath(`/families/${familyId}/persons/${personId}`);
  }
}

async function syncEventParticipants(
  eventId: string,
  participantIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (participantIds.length === 0) {
    return {};
  }

  const { error: insertError } = await supabase.from("event_members").insert(
    participantIds.map((personId) => ({
      event_id: eventId,
      person_id: personId,
    })),
  );

  if (insertError) {
    return { error: insertError.message };
  }

  return {};
}

export async function createEventAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const permission = await requireEventManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const parsed = createEventSchema.safeParse(parseEventFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      family_id: familyId,
      ...toEventPayload(parsed.data),
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const participantResult = await syncEventParticipants(
    data.id,
    parsed.data.participantIds ?? [],
  );

  if (participantResult.error) {
    return participantResult;
  }

  revalidateEventPaths(familyId, {
    eventId: data.id,
    personIds: parsed.data.participantIds,
  });
  redirect(`/families/${familyId}/timeline`);
}

export async function updateEventAction(
  familyId: string,
  eventId: string,
  formData: FormData,
): Promise<ActionResult> {
  const permission = await requireEventManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const existing = await getEventById(familyId, eventId);

  if (!existing) {
    return { error: "Event not found." };
  }

  const parsed = updateEventSchema.safeParse(parseEventFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(toEventPayload(parsed.data))
    .eq("id", eventId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  const participantResult = await syncEventParticipants(
    eventId,
    parsed.data.participantIds ?? [],
  );

  if (participantResult.error) {
    return participantResult;
  }

  const affectedPersonIds = [
    ...new Set([
      ...existing.participants.map((participant) => participant.person_id),
      ...(parsed.data.participantIds ?? []),
    ]),
  ];

  revalidateEventPaths(familyId, {
    eventId,
    personIds: affectedPersonIds,
  });

  return { success: "Event updated successfully." };
}

export async function deleteEventAction(
  familyId: string,
  eventId: string,
): Promise<ActionResult> {
  const permission = await requireEventManagement(familyId);

  if ("error" in permission && permission.error) {
    return { error: permission.error };
  }

  const existing = await getEventById(familyId, eventId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("family_id", familyId);

  if (error) {
    return { error: error.message };
  }

  revalidateEventPaths(familyId, {
    personIds: existing?.participants.map((participant) => participant.person_id),
  });
  redirect(`/families/${familyId}/timeline`);
}
