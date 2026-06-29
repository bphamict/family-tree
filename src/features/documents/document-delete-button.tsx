"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteDocumentAction } from "@/features/documents/document-actions";

type DocumentDeleteButtonProps = {
  familyId: string;
  documentId: string;
};

export function DocumentDeleteButton({
  familyId,
  documentId,
}: DocumentDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this document? This action cannot be undone.",
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
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
