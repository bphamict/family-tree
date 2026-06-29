"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { uploadDocumentSchema } from "@/features/documents/document-schemas";
import { getDocumentById } from "@/features/documents/document-service";
import { getEventById } from "@/features/events/event-service";
import { getFamilyById } from "@/features/families/family-service";
import { getPersonById } from "@/features/persons/person-service";
import { requireUser } from "@/lib/auth/require-user";
import {
  FAMILY_DOCUMENTS_BUCKET,
  inferDocumentType,
} from "@/lib/document/constants";
import { canManageDocuments } from "@/lib/family/permissions";
import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  error?: string;
  success?: string;
};

function parseDocumentFormData(formData: FormData) {
  const personId = formData.get("personId");
  const eventId = formData.get("eventId");

  return {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    personId: typeof personId === "string" && personId ? personId : undefined,
    eventId: typeof eventId === "string" && eventId ? eventId : undefined,
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function requireDocumentManagement(familyId: string): Promise<
  | { error: string }
  | { family: NonNullable<Awaited<ReturnType<typeof getFamilyById>>>; user: Awaited<ReturnType<typeof requireUser>> }
> {
  const user = await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManageDocuments(family.membership.role)) {
    return { error: "You do not have permission to manage documents." };
  }

  return { family, user };
}

async function validateDocumentLinks(
  familyId: string,
  personId?: string,
  eventId?: string,
): Promise<ActionResult> {
  if (personId) {
    const person = await getPersonById(familyId, personId);

    if (!person) {
      return { error: "Selected person was not found in this family." };
    }
  }

  if (eventId) {
    const event = await getEventById(familyId, eventId);

    if (!event) {
      return { error: "Selected event was not found in this family." };
    }
  }

  return {};
}

function revalidateDocumentPaths(
  familyId: string,
  options: {
    documentId?: string;
    personId?: string | null;
    eventId?: string | null;
  } = {},
) {
  revalidatePath(`/families/${familyId}/documents`);
  revalidatePath(`/families/${familyId}`);

  if (options.documentId) {
    revalidatePath(`/families/${familyId}/documents/${options.documentId}`);
  }

  if (options.personId) {
    revalidatePath(`/families/${familyId}/persons/${options.personId}`);
    revalidatePath(`/families/${familyId}/persons/${options.personId}/edit`);
  }

  if (options.eventId) {
    revalidatePath(`/families/${familyId}/events/${options.eventId}/edit`);
    revalidatePath(`/families/${familyId}/timeline`);
  }
}

export async function uploadDocumentAction(
  familyId: string,
  formData: FormData,
  options: {
    redirectTo?: string;
  } = {},
): Promise<ActionResult> {
  const permission = await requireDocumentManagement(familyId);

  if ("error" in permission) {
    return { error: permission.error };
  }

  const { user } = permission;

  const file = formData.get("file");
  const metadata = parseDocumentFormData(formData);

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  const parsed = uploadDocumentSchema.safeParse({
    ...metadata,
    mimeType: file.type,
    fileSize: file.size,
    title:
      typeof metadata.title === "string" && metadata.title.trim()
        ? metadata.title
        : file.name,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const linkValidation = await validateDocumentLinks(
    familyId,
    parsed.data.personId,
    parsed.data.eventId,
  );

  if (linkValidation.error) {
    return linkValidation;
  }

  const documentId = randomUUID();
  const storagePath = `${familyId}/${documentId}/${sanitizeFileName(file.name)}`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(FAMILY_DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(FAMILY_DOCUMENTS_BUCKET).getPublicUrl(storagePath);

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    family_id: familyId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    document_type: inferDocumentType(file.type),
    mime_type: file.type,
    file_url: publicUrl,
    storage_path: storagePath,
    file_size: file.size,
    person_id: parsed.data.personId || null,
    event_id: parsed.data.eventId || null,
    uploaded_by: user.id,
  });

  if (insertError) {
    await supabase.storage.from(FAMILY_DOCUMENTS_BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  revalidateDocumentPaths(familyId, {
    documentId,
    personId: parsed.data.personId ?? null,
    eventId: parsed.data.eventId ?? null,
  });

  if (options.redirectTo) {
    redirect(options.redirectTo);
  }

  return { success: "Document uploaded successfully." };
}

export async function deleteDocumentAction(
  familyId: string,
  documentId: string,
): Promise<ActionResult> {
  const permission = await requireDocumentManagement(familyId);

  if ("error" in permission) {
    return { error: permission.error };
  }

  const document = await getDocumentById(familyId, documentId);

  if (!document) {
    return { error: "Document not found." };
  }

  const supabase = await createClient();

  const { error: storageError } = await supabase.storage
    .from(FAMILY_DOCUMENTS_BUCKET)
    .remove([document.storage_path]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("family_id", familyId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidateDocumentPaths(familyId, {
    personId: document.person_id,
    eventId: document.event_id,
  });

  return { success: "Document deleted successfully." };
}
