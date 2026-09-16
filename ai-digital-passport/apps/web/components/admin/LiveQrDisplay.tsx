"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminEventsApi } from "../../lib/api";

// Page 25 — the live-refreshing QR meant to be projected at the venue.
// Payload format matches what apps/web's student Scan page (Page 17)
// expects: {"sessionId","token"} JSON, encoded as a scannable QR image.
export function LiveQrDisplay({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qr = useQuery({
    queryKey: ["admin", "events", "qr", sessionId],
    queryFn: () => adminEventsApi.currentQr(sessionId),
    refetchInterval: (query) => (query.state.data?.refreshSeconds ?? 15) * 1000,
  });
  const attendance = useQuery({
    queryKey: ["admin", "events", "attendance", sessionId],
    queryFn: () => adminEventsApi.attendanceCount(sessionId),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!qr.data || !canvasRef.current) return;
    const payload = JSON.stringify({ sessionId, token: qr.data.token });
    void import("qrcode").then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, payload, { width: 280, margin: 1 });
      }
    });
  }, [qr.data, sessionId]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-navy-700 bg-white p-6">
      <canvas ref={canvasRef} />
      <div className="font-mono text-h1 tracking-widest text-ink">{qr.data?.token ?? "……"}</div>
      <div className="text-caption text-text-muted">Refreshes every {qr.data?.refreshSeconds ?? 15}s</div>
      <div className="font-mono text-h2 text-accent-deep">{attendance.data?.count ?? 0} checked in</div>
    </div>
  );
}
