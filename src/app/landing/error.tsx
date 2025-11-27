"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LandingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Landing route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-xl font-semibold">This section is unavailable</h2>

        <p className="text-sm text-muted-foreground">
          We hit a snag while loading this page. You can try again or go back.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="outline" asChild>
            <a href="/">Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
