"use client";

import {
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/use-translator";
import { formatPersonName, type Person } from "@/types/person";
import { MAX_TREE_DEPTH } from "@/types/tree";

type FamilyTreeToolbarProps = {
  persons: Person[];
  rootPersonId: string;
  searchQuery: string;
  ancestorDepth: number;
  descendantDepth: number;
  hasMoreAncestors: boolean;
  hasMoreDescendants: boolean;
  scale: number;
  onSearchQueryChange: (value: string) => void;
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
  searchQuery,
  ancestorDepth,
  descendantDepth,
  hasMoreAncestors,
  hasMoreDescendants,
  scale,
  onSearchQueryChange,
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
  const filteredPersons = persons.filter((person) => {
    const name = formatPersonName(person).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-background/95 flex flex-col gap-4 border-b p-4 backdrop-blur">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="grid gap-2">
          <Label htmlFor="tree-search">{t("tree.searchMembers")}</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="tree-search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={t("tree.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          {searchQuery && filteredPersons.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border">
              {filteredPersons.slice(0, 8).map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="hover:bg-accent block w-full px-3 py-2 text-left text-sm"
                  onClick={() => {
                    onRootPersonChange(person.id);
                    onSearchQueryChange("");
                  }}
                >
                  {formatPersonName(person)}
                </button>
              ))}
            </div>
          )}
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

      <div className="flex flex-wrap items-center gap-2">
        <Label className="sr-only">{t("tree.focusPerson")}</Label>
        <select
          value={rootPersonId}
          onChange={(event) => onRootPersonChange(event.target.value)}
          className="border-input bg-background h-9 min-w-[220px] rounded-md border px-3 text-sm"
        >
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {formatPersonName(person)}
            </option>
          ))}
        </select>
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
