"use client";

import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "./api";

// Points for a scoring-matrix category, read live from the admin-configured matrix.
export function useScoringPoints(category: string): number | null {
  const rules = useQuery({ queryKey: ["activities", "rules"], queryFn: () => activitiesApi.discover(), staleTime: 60_000 });
  return rules.data?.find((r) => r.category === category)?.points ?? null;
}
