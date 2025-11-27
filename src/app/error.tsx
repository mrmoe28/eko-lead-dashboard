"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
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

        <h1 className="text-2xl font-semibold">Something went wrong</h1>

        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or return to the homepage.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
