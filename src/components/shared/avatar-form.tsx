"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { AvatarViewDialog } from "@/components/shared/avatar-view-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prepareAvatarFormData } from "@/lib/image/compress-avatar";
import { useTranslations } from "@/lib/i18n/use-translator";

type ActionResult = {
  error?: string;
  success?: string;
};

type AvatarFormLabels = {
  uploadAvatar: string;
  uploadImage: string;
  removeAvatar: string;
  selectImageError: string;
};

type AvatarFormProps = {
  avatarUrl: string | null;
  previewAlt: string;
  preview: ReactNode;
  labels: AvatarFormLabels;
  onUpload: (formData: FormData) => Promise<ActionResult>;
  onRemove: () => Promise<ActionResult>;
};

export function AvatarForm({
  avatarUrl,
  previewAlt,
  preview,
  labels,
  onUpload,
  onRemove,
}: AvatarFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const uploadData = await prepareAvatarFormData(formData);

        if (!uploadData) {
          toast.error(labels.selectImageError);
          return;
        }

        const result = await onUpload(uploadData);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(result.success);
      } catch {
        toast.error(t("common.imageCompressFailed"));
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await onRemove();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
    });
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      {avatarUrl ? (
        <AvatarViewDialog avatarUrl={avatarUrl} alt={previewAlt}>
          {preview}
        </AvatarViewDialog>
      ) : (
        preview
      )}

      <form
        action={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
            className="min-w-0 flex-1"
            aria-label={labels.uploadAvatar}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="shrink-0"
          >
            {isPending ? t("common.uploading") : labels.uploadImage}
          </Button>
        </div>
        {avatarUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRemove}
          >
            {isPending ? t("common.removing") : labels.removeAvatar}
          </Button>
        ) : null}
      </form>
    </div>
  );
}
