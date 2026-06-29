import { DocumentCard } from "@/features/documents/document-card";
import type { Document } from "@/types/document";

type DocumentGalleryProps = {
  familyId: string;
  documents: Document[];
  canManage: boolean;
};

export function DocumentGallery({
  familyId,
  documents,
  canManage,
}: DocumentGalleryProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No documents match your filters yet.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          familyId={familyId}
          document={document}
          canManage={canManage}
        />
      ))}
    </section>
  );
}
