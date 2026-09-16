"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * CRITICAL (per @capgo/capacitor-updater's own docs): must be called on
 * every app launch, or the native layer assumes the JS bundle failed to
 * load and automatically rolls back to the previous OTA bundle after
 * `appReadyTimeout` (10s default) — even though nothing is actually
 * wrong. This is the one line that makes the whole update mechanism safe
 * to use. No-ops on plain web (`autoUpdate`/OTA only applies natively).
 */
export function OtaBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void import("@capgo/capacitor-updater").then(({ CapacitorUpdater }) => {
      void CapacitorUpdater.notifyAppReady();
    });
  }, []);

  return null;
}
