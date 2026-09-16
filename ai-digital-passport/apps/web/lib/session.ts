"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi, meApi } from "./api";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: authApi.session,
    retry: false,
    staleTime: 30_000,
  });
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: meApi.get,
    enabled,
    retry: false,
    staleTime: 10_000,
  });
}
