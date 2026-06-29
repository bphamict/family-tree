"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteDocumentAction } from "@/features/documents/document-actions";
import { useTranslations } from "@/lib/i18n/use-translator";

type DocumentDeleteButtonProps = {
  familyId: string;
  documentId: string;
};

export function DocumentDeleteButton({
  familyId,
  documentId,
}: DocumentDeleteButtonProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      t("document.deleteConfirm", { confirm: t("common.confirmDelete") }),
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteDocumentAction(familyId, documentId);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.success) {
        toast.success(result.success);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? t("common.deleting") : t("common.delete")}
    </Button>
  );
}
