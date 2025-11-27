"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ScrapingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Scraping route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold">Scraping service unavailable</h2>

        <p className="text-sm text-muted-foreground">
          We couldn't load the scraping interface. Please try again or return to the dashboard.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="outline" asChild>
            <a href="/">Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
