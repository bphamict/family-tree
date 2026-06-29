import { DocumentCard } from "@/features/documents/document-card";
import { getTranslations } from "@/lib/i18n/translator";
import type { Document } from "@/types/document";

type DocumentGalleryProps = {
  familyId: string;
  documents: Document[];
  canManage: boolean;
};

export async function DocumentGallery({
  familyId,
  documents,
  canManage,
}: DocumentGalleryProps) {
  const t = await getTranslations();

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("document.empty")}</p>
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
