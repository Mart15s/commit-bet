"use client";

import { useEffect } from "react";
import { Button, Card } from "@/components/ui";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("commitbet_route_error", { digest: error.digest });
  }, [error.digest]);

  return (
    <Card className="mx-auto mt-12 max-w-xl text-center">
      <h1 className="text-2xl font-black">This page could not be loaded</h1>
      <p className="mt-3 text-muted-foreground">Your data was not changed. Retry the request or return to the dashboard.</p>
      <Button className="mt-5" onClick={unstable_retry}>Try again</Button>
    </Card>
  );
}
