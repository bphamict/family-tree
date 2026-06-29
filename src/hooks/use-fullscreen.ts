"use client";

import { useCallback, useEffect, useState } from "react";

type UseFullscreenResult<T extends HTMLElement> = {
  ref: (node: T | null) => void;
  isFullscreen: boolean;
  toggle: () => Promise<void>;
};

export function useFullscreen<T extends HTMLElement>(): UseFullscreenResult<T> {
  const [element, setElement] = useState<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }

    function handleFullscreenChange(): void {
      setIsFullscreen(document.fullscreenElement === element);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [element]);

  const toggle = useCallback(async () => {
    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }, [element]);

  return { ref, isFullscreen, toggle };
}
