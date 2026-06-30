"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n/use-translator";
import { cn } from "@/lib/utils";

type AvatarViewDialogProps = {
  avatarUrl: string;
  alt: string;
  children: ReactNode;
  className?: string;
};

export function AvatarViewDialog({
  avatarUrl,
  alt,
  children,
  className,
}: AvatarViewDialogProps) {
  const t = useTranslations();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus-visible:ring-ring cursor-zoom-in rounded-full focus-visible:ring-2 focus-visible:outline-none",
            className,
          )}
          aria-label={t("common.viewAvatar")}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-2 sm:max-w-lg">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative aspect-square max-h-[min(80vh,32rem)] w-full">
          <Image
            src={avatarUrl}
            alt={alt}
            fill
            sizes="(max-width: 512px) 100vw, 512px"
            className="rounded-md object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
