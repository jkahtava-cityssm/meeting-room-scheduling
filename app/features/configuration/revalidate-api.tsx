"use client";

import { useRevalidateAndInvalidate } from "@/hooks/use-revalidate-cache";
import { Button } from "@/components/ui/button";

export function RevalidateButton() {
  const { revalidateAndInvalidate } = useRevalidateAndInvalidate();

  return <Button onClick={revalidateAndInvalidate}>Clear Cached API Routes</Button>;
}
