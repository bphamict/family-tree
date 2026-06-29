"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getCanvasBounds,
  getRenderedTreeEdges,
  layoutTree,
} from "@/features/family-tree/tree-layout";
import { FamilyTreeNodeCard } from "@/features/family-tree/family-tree-node";
import { FamilyTreeToolbar } from "@/features/family-tree/family-tree-toolbar";
import { useFamilyTree } from "@/features/family-tree/use-family-tree";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useTranslations } from "@/lib/i18n/use-translator";
import { cn } from "@/lib/utils";
import { formatPersonName, type Person } from "@/types/person";
import {
  DEFAULT_ANCESTOR_DEPTH,
  DEFAULT_DESCENDANT_DEPTH,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  type TreeViewport,
} from "@/types/tree";

type FamilyTreeViewProps = {
  familyId: string;
  persons: Person[];
  initialRootPersonId: string;
  className?: string;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 2;
const BUTTON_ZOOM_STEP = 0.1;
const WHEEL_ZOOM_SENSITIVITY = 0.004;

export function FamilyTreeView({
  familyId,
  persons,
  initialRootPersonId,
  className,
}: FamilyTreeViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [rootPersonId, setRootPersonId] = useState(initialRootPersonId);
  const [ancestorDepth, setAncestorDepth] = useState(DEFAULT_ANCESTOR_DEPTH);
  const [descendantDepth, setDescendantDepth] = useState(
    DEFAULT_DESCENDANT_DEPTH,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewport, setViewport] = useState<TreeViewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0 });
  const viewportOrigin = useRef({ x: 0, y: 0 });
  const pendingPanPointerId = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    ref: containerRef,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useFullscreen<HTMLDivElement>();

  const { data, isLoading, isError, error } = useFamilyTree({
    familyId,
    rootPersonId,
    ancestorDepth,
    descendantDepth,
  });

  const layoutNodes = useMemo(() => {
    if (!data) {
      return [];
    }

    return layoutTree(rootPersonId, data.nodes, data.edges);
  }, [data, rootPersonId]);

  const bounds = useMemo(() => getCanvasBounds(layoutNodes), [layoutNodes]);

  const renderedEdges = useMemo(() => {
    if (!data) {
      return [];
    }

    return getRenderedTreeEdges(data.edges, layoutNodes, bounds);
  }, [bounds, data, layoutNodes]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const deltaY = normalizeWheelDelta(event, rect.height);
    const zoomFactor = Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);

    setViewport((current) => {
      const nextScale = clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE);

      if (nextScale === current.scale) {
        return current;
      }

      const scaleRatio = nextScale / current.scale;

      return {
        scale: nextScale,
        x: pointerX - (pointerX - current.x) * scaleRatio,
        y: pointerY - (pointerY - current.y) * scaleRatio,
      };
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest("button, a, input, select, textarea, [data-no-pan]")) {
        return;
      }

      pendingPanPointerId.current = event.pointerId;
      panOrigin.current = { x: event.clientX, y: event.clientY };
      viewportOrigin.current = { x: viewport.x, y: viewport.y };
    },
    [viewport.x, viewport.y],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const isPendingPan = pendingPanPointerId.current === event.pointerId;

      if (!isPanning && !isPendingPan) {
        return;
      }

      const deltaX = event.clientX - panOrigin.current.x;
      const deltaY = event.clientY - panOrigin.current.y;

      if (!isPanning && isPendingPan) {
        if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) {
          return;
        }

        setIsPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      setViewport((current) => ({
        ...current,
        x: viewportOrigin.current.x + deltaX,
        y: viewportOrigin.current.y + deltaY,
      }));
    },
    [isPanning],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isPanning) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setIsPanning(false);
      pendingPanPointerId.current = null;
    },
    [isPanning],
  );

  const resetView = useCallback(() => {
    if (!canvasRef.current || layoutNodes.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }

    const canvas = canvasRef.current.getBoundingClientRect();
    const scale = clamp(
      Math.min(
        (canvas.width - 80) / Math.max(bounds.width, TREE_NODE_WIDTH),
        (canvas.height - 80) / Math.max(bounds.height, TREE_NODE_HEIGHT),
      ),
      MIN_SCALE,
      MAX_SCALE,
    );

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    setViewport({
      scale,
      x: canvas.width / 2 - centerX * scale,
      y: canvas.height / 2 - centerY * scale,
    });
  }, [
    bounds.height,
    bounds.minX,
    bounds.minY,
    bounds.width,
    layoutNodes.length,
  ]);

  const handleRootChange = useCallback(
    (personId: string) => {
      setRootPersonId(personId);

      const params = new URLSearchParams();
      params.set("root", personId);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  useEffect(() => {
    setRootPersonId(initialRootPersonId);
  }, [initialRootPersonId]);

  useEffect(() => {
    if (layoutNodes.length === 0 || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current.getBoundingClientRect();
    const currentBounds = getCanvasBounds(layoutNodes);
    const scale = clamp(
      Math.min(
        (canvas.width - 80) / Math.max(currentBounds.width, TREE_NODE_WIDTH),
        (canvas.height - 80) / Math.max(currentBounds.height, TREE_NODE_HEIGHT),
      ),
      MIN_SCALE,
      MAX_SCALE,
    );

    const centerX = currentBounds.minX + currentBounds.width / 2;
    const centerY = currentBounds.minY + currentBounds.height / 2;

    setViewport({
      scale,
      x: canvas.width / 2 - centerX * scale,
      y: canvas.height / 2 - centerY * scale,
    });
  }, [layoutNodes, rootPersonId]);

  useEffect(() => {
    if (layoutNodes.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      resetView();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isFullscreen, layoutNodes.length, resetView]);

  if (persons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("tree.empty")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-card flex flex-col overflow-hidden rounded-xl border",
        isFullscreen
          ? "bg-background h-full w-full rounded-none border-0"
          : "min-h-[680px] flex-1",
        className,
      )}
    >
      <FamilyTreeToolbar
        persons={persons}
        rootPersonId={rootPersonId}
        searchQuery={searchQuery}
        ancestorDepth={ancestorDepth}
        descendantDepth={descendantDepth}
        hasMoreAncestors={data?.hasMoreAncestors ?? false}
        hasMoreDescendants={data?.hasMoreDescendants ?? false}
        scale={viewport.scale}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => {
          void toggleFullscreen();
        }}
        onSearchQueryChange={setSearchQuery}
        onRootPersonChange={handleRootChange}
        onAncestorDepthChange={setAncestorDepth}
        onDescendantDepthChange={setDescendantDepth}
        onZoomIn={() =>
          setViewport((current) => ({
            ...current,
            scale: clamp(
              current.scale + BUTTON_ZOOM_STEP,
              MIN_SCALE,
              MAX_SCALE,
            ),
          }))
        }
        onZoomOut={() =>
          setViewport((current) => ({
            ...current,
            scale: clamp(
              current.scale - BUTTON_ZOOM_STEP,
              MIN_SCALE,
              MAX_SCALE,
            ),
          }))
        }
        onResetView={resetView}
      />

      <div
        ref={canvasRef}
        className={cn(
          "bg-muted/40 relative flex-1 overflow-hidden",
          "bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:24px_24px]",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        )}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">{t("tree.loading")}</p>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : t("tree.loadFailed")}
            </p>
          </div>
        )}

        {!isLoading && data && layoutNodes.length > 0 && (
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            <svg
              className="pointer-events-none absolute z-0 overflow-visible"
              width={Math.max(bounds.width, TREE_NODE_WIDTH)}
              height={Math.max(bounds.height, TREE_NODE_HEIGHT)}
              style={{
                left: bounds.minX,
                top: bounds.minY,
              }}
            >
              {renderedEdges.map((edge) => (
                <path
                  key={edge.id}
                  d={edge.d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground"
                />
              ))}
            </svg>

            {layoutNodes.map((node) => (
              <FamilyTreeNodeCard
                key={node.person.id}
                node={node}
                familyId={familyId}
                onSetRoot={handleRootChange}
              />
            ))}
          </div>
        )}

        {!isLoading && data && layoutNodes.length === 1 && (
          <div className="bg-background/90 absolute right-4 bottom-4 rounded-md border px-3 py-2 text-sm shadow-sm">
            {t("tree.showingPerson", {
              name: formatPersonName(layoutNodes[0].person),
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeWheelDelta(
  event: React.WheelEvent<HTMLDivElement>,
  canvasHeight: number,
): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * canvasHeight;
  }

  return event.deltaY;
}
