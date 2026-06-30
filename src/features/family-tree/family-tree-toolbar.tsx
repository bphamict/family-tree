"use client";

import { Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PersonSelect } from "@/components/shared/person-select";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { Person } from "@/types/person";
import { MAX_TREE_DEPTH } from "@/types/tree";

type FamilyTreeToolbarProps = {
  persons: Person[];
  rootPersonId: string;
  ancestorDepth: number;
  descendantDepth: number;
  hasMoreAncestors: boolean;
  hasMoreDescendants: boolean;
  scale: number;
  onRootPersonChange: (personId: string) => void;
  onAncestorDepthChange: (depth: number) => void;
  onDescendantDepthChange: (depth: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function FamilyTreeToolbar({
  persons,
  rootPersonId,
  ancestorDepth,
  descendantDepth,
  hasMoreAncestors,
  hasMoreDescendants,
  scale,
  onRootPersonChange,
  onAncestorDepthChange,
  onDescendantDepthChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  isFullscreen,
  onToggleFullscreen,
}: FamilyTreeToolbarProps) {
  const t = useTranslations();

  return (
    <div className="bg-background/95 border-b p-4 backdrop-blur">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="focus-person">{t("tree.focusPerson")}</Label>
          <PersonSelect
            id="focus-person"
            persons={persons}
            value={rootPersonId}
            onValueChange={onRootPersonChange}
            className="w-full min-w-0"
          />
        </div>

        <DepthControl
          label={t("tree.ancestors")}
          depth={ancestorDepth}
          hasMore={hasMoreAncestors}
          onChange={onAncestorDepthChange}
        />

        <DepthControl
          label={t("tree.descendants")}
          depth={descendantDepth}
          hasMore={hasMoreDescendants}
          onChange={onDescendantDepthChange}
        />

        <div className="flex flex-col gap-2">
          <Label>{t("tree.zoom")}</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onZoomOut}
            >
              <Minus className="size-4" />
            </Button>
            <span className="text-muted-foreground w-14 text-center text-sm">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onZoomIn}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onResetView}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleFullscreen}
              aria-label={
                isFullscreen
                  ? t("tree.exitFullscreen")
                  : t("tree.enterFullscreen")
              }
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DepthControlProps = {
  label: string;
  depth: number;
  hasMore: boolean;
  onChange: (depth: number) => void;
};

function DepthControl({ label, depth, hasMore, onChange }: DepthControlProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={depth <= 0}
          onClick={() => onChange(depth - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-10 text-center text-sm font-medium">{depth}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={depth >= MAX_TREE_DEPTH}
          onClick={() => onChange(depth + 1)}
        >
          <Plus className="size-4" />
        </Button>
        {hasMore && (
          <span className="text-muted-foreground text-xs">
            {t("tree.moreAvailable")}
          </span>
        )}
      </div>
    </div>
  );
}
