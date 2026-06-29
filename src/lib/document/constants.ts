export const DOCUMENT_TYPES = ["image", "pdf", "video", "other"] as const;

export type DocumentTypeConstant = (typeof DOCUMENT_TYPES)[number];

export const FAMILY_DOCUMENTS_BUCKET = "family-documents";

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeConstant, string> = {
  image: "Image",
  pdf: "PDF",
  video: "Video",
  other: "Document",
};

export const DOCUMENT_ACCEPT_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm,video/quicktime";

export const MAX_DOCUMENT_SIZE_BYTES = 52_428_800;

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export function inferDocumentType(mimeType: string): DocumentTypeConstant {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
