import Link from "next/link";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentDeleteButton } from "@/features/documents/document-delete-button";
import {
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
} from "@/lib/document/constants";
import type { Document } from "@/types/document";

type LinkedDocumentsSectionProps = {
  familyId: string;
  documents: Document[];
  canManage: boolean;
  title?: string;
  description?: string;
  uploadHref?: string;
};

export function LinkedDocumentsSection({
  familyId,
  documents,
  canManage,
  title = "Documents",
  description = "Files linked to this record.",
  uploadHref,
}: LinkedDocumentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canManage && uploadHref && (
            <Button asChild size="sm" variant="outline">
              <Link href={uploadHref}>Upload</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No documents yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{document.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {DOCUMENT_TYPE_LABELS[document.document_type]} ·{" "}
                      {formatFileSize(document.file_size)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {DOCUMENT_TYPE_LABELS[document.document_type]}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  </Button>
                  {canManage && (
                    <DocumentDeleteButton
                      familyId={familyId}
                      documentId={document.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
