import { createClient } from "@/lib/supabase/server";
import type {
  Event,
  EventParticipant,
  EventSearchFilters,
  EventType,
  EventWithParticipants,
} from "@/types/event";

const EVENT_SELECT =
  "id, family_id, title, description, event_type, event_date, location, created_at, updated_at";

const EVENT_WITH_PARTICIPANTS_SELECT = `
  ${EVENT_SELECT},
  event_members (
    id,
    person_id,
    persons (
      id,
      first_name,
      middle_name,
      last_name,
      avatar_url
    )
  )
`;

type EventRow = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type EventMemberRow = {
  id: string;
  person_id: string;
  persons: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    avatar_url: string | null;
  } | null;
};

type EventWithMembersRow = EventRow & {
  event_members: EventMemberRow[] | null;
};

function mapEvent(row: EventRow): Event {
  return {
    ...row,
    event_type: row.event_type as EventType,
  };
}

function mapParticipants(members: EventMemberRow[] | null): EventParticipant[] {
  return (members ?? [])
    .filter((member) => member.persons !== null)
    .map((member) => ({
      id: member.id,
      person_id: member.persons!.id,
      first_name: member.persons!.first_name,
      middle_name: member.persons!.middle_name,
      last_name: member.persons!.last_name,
      avatar_url: member.persons!.avatar_url,
    }));
}

function mapEventWithParticipants(row: EventWithMembersRow): EventWithParticipants {
  return {
    ...mapEvent(row),
    participants: mapParticipants(row.event_members),
  };
}

export async function getEventsByFamily(
  familyId: string,
  filters: EventSearchFilters = {},
): Promise<EventWithParticipants[]> {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(EVENT_WITH_PARTICIPANTS_SELECT)
    .eq("family_id", familyId)
    .order("event_date", { ascending: true })
    .order("title", { ascending: true });

  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.year) {
    query = query
      .gte("event_date", `${filters.year}-01-01`)
      .lte("event_date", `${filters.year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as EventWithMembersRow[]).map(mapEventWithParticipants);
}

export async function getEventById(
  familyId: string,
  eventId: string,
): Promise<EventWithParticipants | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_PARTICIPANTS_SELECT)
    .eq("family_id", familyId)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapEventWithParticipants(data as EventWithMembersRow);
}

export async function getEventsForPerson(
  familyId: string,
  personId: string,
): Promise<EventWithParticipants[]> {
  const supabase = await createClient();

  const { data: memberRows, error: memberError } = await supabase
    .from("event_members")
    .select("event_id")
    .eq("person_id", personId);

  if (memberError) {
    throw memberError;
  }

  const eventIds = (memberRows ?? []).map((row) => row.event_id);

  if (eventIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_PARTICIPANTS_SELECT)
    .eq("family_id", familyId)
    .in("id", eventIds)
    .order("event_date", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as EventWithMembersRow[]).map(mapEventWithParticipants);
}

export async function getEventCount(familyId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}
