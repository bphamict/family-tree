import Image from "next/image";
import Link from "next/link";
import { FileText, Video } from "lucide-react";

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
import { formatFileSize } from "@/lib/document/constants";
import { getTranslations } from "@/lib/i18n/translator";
import type { Document } from "@/types/document";

type DocumentCardProps = {
  familyId: string;
  document: Document;
  canManage: boolean;
};

export async function DocumentCard({
  familyId,
  document,
  canManage,
}: DocumentCardProps) {
  const t = await getTranslations();

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted relative flex aspect-[4/3] items-center justify-center">
        {document.document_type === "image" ? (
          <Image
            src={document.file_url}
            alt={document.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : document.document_type === "pdf" ? (
          <FileText className="text-muted-foreground size-16" aria-hidden />
        ) : document.document_type === "video" ? (
          <Video className="text-muted-foreground size-16" aria-hidden />
        ) : (
          <FileText className="text-muted-foreground size-16" aria-hidden />
        )}
      </div>

      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              {document.title}
            </CardTitle>
            <CardDescription>
              {formatFileSize(document.file_size)}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {t(`document.types.${document.document_type}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {document.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {document.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          {document.person_id && (
            <Link
              href={`/families/${familyId}/persons/${document.person_id}`}
              className="text-primary hover:underline"
            >
              {t("common.viewPerson")}
            </Link>
          )}
          {document.event_id && (
            <Link
              href={`/families/${familyId}/events/${document.event_id}/edit`}
              className="text-primary hover:underline"
            >
              {t("common.viewEvent")}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("common.openFile")}
            </a>
          </Button>
          {canManage && (
            <DocumentDeleteButton
              familyId={familyId}
              documentId={document.id}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
