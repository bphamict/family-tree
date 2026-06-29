import { createClient } from "@/lib/supabase/server";
import type {
  Document,
  DocumentSearchFilters,
  DocumentType,
} from "@/types/document";

const DOCUMENT_SELECT =
  "id, family_id, title, description, document_type, mime_type, file_url, storage_path, file_size, person_id, event_id, uploaded_by, created_at, updated_at";

function mapDocument(row: {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  document_type: string;
  mime_type: string;
  file_url: string;
  storage_path: string;
  file_size: number;
  person_id: string | null;
  event_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}): Document {
  return {
    ...row,
    document_type: row.document_type as DocumentType,
  };
}

export async function getDocumentsByFamily(
  familyId: string,
  filters: DocumentSearchFilters = {},
): Promise<Document[]> {
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (filters.documentType) {
    query = query.eq("document_type", filters.documentType);
  }

  if (filters.personId) {
    query = query.eq("person_id", filters.personId);
  }

  if (filters.eventId) {
    query = query.eq("event_id", filters.eventId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapDocument);
}

export async function getDocumentById(
  familyId: string,
  documentId: string,
): Promise<Document | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("family_id", familyId)
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapDocument(data);
}

export async function getDocumentCount(familyId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}
