"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Lenis from "lenis";

type Props = {
  children: ReactNode;
};

export function SmoothScrollProvider({ children }: Props) {
  // Guard against running in non-browser environments
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  useEffect(() => {
    let frameId: number | null = null;

    try {
      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      };

      frameId = requestAnimationFrame(raf);

      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        if (typeof lenis?.destroy === "function") {
          lenis.destroy();
        }
      };
    } catch (error) {
      console.error("Lenis initialization failed:", error);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      // Fallback: just render children without smooth scroll
      return;
    }
  }, []);

  return <>{children}</>;
}
