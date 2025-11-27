"use client";

import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  fallbackMessage?: string;
};

function Fallback({
  error,
  resetErrorBoundary,
  fallbackMessage,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  fallbackMessage?: string;
}) {
  console.error("Component error:", error);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-6 w-6 text-destructive"
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

      <p className="mb-3 text-sm font-medium text-foreground">
        {fallbackMessage ?? "Something went wrong loading this section."}
      </p>

      <Button onClick={resetErrorBoundary} size="sm" variant="outline">
        Try again
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children, fallbackMessage }: Props) {
  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <Fallback {...props} fallbackMessage={fallbackMessage} />
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
}
