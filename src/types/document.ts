export type DocumentType = "image" | "pdf" | "video" | "other";

export type Document = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  mime_type: string;
  file_url: string;
  storage_path: string;
  file_size: number;
  person_id: string | null;
  event_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentSearchFilters = {
  documentType?: DocumentType;
  personId?: string;
  eventId?: string;
};
