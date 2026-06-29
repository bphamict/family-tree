"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getCanvasBounds,
  getEdgePath,
  layoutTree,
} from "@/features/family-tree/tree-layout";
import { FamilyTreeNodeCard } from "@/features/family-tree/family-tree-node";
import { FamilyTreeToolbar } from "@/features/family-tree/family-tree-toolbar";
import { useFamilyTree } from "@/features/family-tree/use-family-tree";
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
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 2;
const SCALE_STEP = 0.1;

export function FamilyTreeView({
  familyId,
  persons,
  initialRootPersonId,
}: FamilyTreeViewProps) {
  const [rootPersonId, setRootPersonId] = useState(initialRootPersonId);
  const [ancestorDepth, setAncestorDepth] = useState(DEFAULT_ANCESTOR_DEPTH);
  const [descendantDepth, setDescendantDepth] = useState(DEFAULT_DESCENDANT_DEPTH);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewport, setViewport] = useState<TreeViewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0 });
  const viewportOrigin = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const layoutMap = useMemo(
    () => new Map(layoutNodes.map((node) => [node.person.id, node])),
    [layoutNodes],
  );

  const bounds = useMemo(() => getCanvasBounds(layoutNodes), [layoutNodes]);

  const visibleEdges = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.edges.filter((edge) => {
      const source = layoutMap.get(edge.sourceId);
      const target = layoutMap.get(edge.targetId);
      return source && target;
    });
  }, [data, layoutMap]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1;
    setViewport((current) => {
      const nextScale = clamp(
        current.scale + direction * SCALE_STEP,
        MIN_SCALE,
        MAX_SCALE,
      );

      return { ...current, scale: nextScale };
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      setIsPanning(true);
      panOrigin.current = { x: event.clientX, y: event.clientY };
      viewportOrigin.current = { x: viewport.x, y: viewport.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [viewport.x, viewport.y],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanning) {
        return;
      }

      const deltaX = event.clientX - panOrigin.current.x;
      const deltaY = event.clientY - panOrigin.current.y;

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
      setIsPanning(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
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
  }, [bounds.height, bounds.minX, bounds.minY, bounds.width, layoutNodes.length]);

  const handleRootChange = useCallback((personId: string) => {
    setRootPersonId(personId);
  }, []);

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

  if (persons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Add family members before viewing the family tree.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[560px] flex-col overflow-hidden rounded-xl border">
      <FamilyTreeToolbar
        persons={persons}
        rootPersonId={rootPersonId}
        searchQuery={searchQuery}
        ancestorDepth={ancestorDepth}
        descendantDepth={descendantDepth}
        hasMoreAncestors={data?.hasMoreAncestors ?? false}
        hasMoreDescendants={data?.hasMoreDescendants ?? false}
        scale={viewport.scale}
        onSearchQueryChange={setSearchQuery}
        onRootPersonChange={handleRootChange}
        onAncestorDepthChange={setAncestorDepth}
        onDescendantDepthChange={setDescendantDepth}
        onZoomIn={() =>
          setViewport((current) => ({
            ...current,
            scale: clamp(current.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
          }))
        }
        onZoomOut={() =>
          setViewport((current) => ({
            ...current,
            scale: clamp(current.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
          }))
        }
        onResetView={resetView}
      />

      <div
        ref={canvasRef}
        className={cn(
          "bg-muted/20 relative flex-1 overflow-hidden",
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
            <p className="text-muted-foreground text-sm">Loading family tree...</p>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : "Failed to load tree"}
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
              className="pointer-events-none absolute overflow-visible"
              width={Math.max(bounds.width, TREE_NODE_WIDTH)}
              height={Math.max(bounds.height, TREE_NODE_HEIGHT)}
              style={{
                left: bounds.minX,
                top: bounds.minY,
              }}
            >
              {visibleEdges.map((edge) => {
                const source = layoutMap.get(edge.sourceId);
                const target = layoutMap.get(edge.targetId);

                if (!source || !target) {
                  return null;
                }

                return (
                  <path
                    key={edge.id}
                    d={getEdgePath(
                      {
                        ...source,
                        x: source.x - bounds.minX,
                        y: source.y - bounds.minY,
                      },
                      {
                        ...target,
                        x: target.x - bounds.minX,
                        y: target.y - bounds.minY,
                      },
                      edge.type,
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={edge.type === "spouse" ? 2 : 1.5}
                    className={
                      edge.type === "spouse"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                    strokeDasharray={edge.type === "spouse" ? "0" : "0"}
                  />
                );
              })}
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
          <div className="absolute right-4 bottom-4 rounded-md border bg-background/90 px-3 py-2 text-sm shadow-sm">
            Showing {formatPersonName(layoutNodes[0].person)}. Add relationships
            to grow the tree.
          </div>
        )}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
