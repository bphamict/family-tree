export type EventType =
  "birth" | "death" | "wedding" | "memorial" | "reunion" | "other";

export type Event = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  event_date: string;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type EventMember = {
  id: string;
  event_id: string;
  person_id: string;
  created_at: string;
};

export type EventParticipant = {
  id: string;
  person_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  avatar_url: string | null;
};

export type EventWithParticipants = Event & {
  participants: EventParticipant[];
};

export type EventSearchFilters = {
  eventType?: EventType;
  year?: string;
};
