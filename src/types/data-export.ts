import type { EventType } from "@/types/event";
import type { PersonGender } from "@/types/person";
import type { StoredRelationshipType } from "@/types/relationship";

export const FAMILY_EXPORT_VERSION = 1 as const;

export type ExportPersonRecord = {
  ref: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  other_name: string | null;
  gender: PersonGender | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  occupation: string | null;
};

export type ExportRelationshipRecord = {
  person1_ref: string;
  person2_ref: string;
  relationship_type: StoredRelationshipType;
  start_date: string | null;
  end_date: string | null;
  birth_order: number | null;
};

export type ExportEventRecord = {
  ref: string;
  title: string;
  description: string | null;
  event_type: EventType;
  event_date: string;
  location: string | null;
  participant_refs: string[];
};

export type FamilyExportBundle = {
  version: typeof FAMILY_EXPORT_VERSION;
  exported_at: string;
  family_name: string;
  persons: ExportPersonRecord[];
  relationships: ExportRelationshipRecord[];
  events: ExportEventRecord[];
};

export type CsvPersonRow = ExportPersonRecord & {
  father_ref?: string | null;
  mother_ref?: string | null;
  spouse_refs?: string | null;
};

export type ImportResult = {
  persons: number;
  relationships: number;
  events: number;
  skippedRows: number;
  warnings: string[];
};

export type ExportFormat = "json" | "csv";
