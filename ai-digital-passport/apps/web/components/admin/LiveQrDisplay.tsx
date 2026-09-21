"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminEventsApi } from "../../lib/api";
import { QrCode, Users, RefreshCw, Sparkles, Maximize2, Minimize2, Radio } from "lucide-react";

export function LiveQrDisplay({ sessionId, startsAt, endsAt }: { sessionId: string; startsAt?: string; endsAt?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1024 : window.innerWidth));

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15000);
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => {
      clearInterval(tick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const startMs = startsAt ? new Date(startsAt).getTime() : null;
  const endMs = endsAt ? new Date(endsAt).getTime() : null;
  const notStarted = startMs !== null && now < startMs;
  const ended = endMs !== null && now > endMs;
  const windowClosed = notStarted || ended;
  const fmtDateTime = (ms: number) =>
    new Date(ms).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const qr = useQuery({
    queryKey: ["admin", "events", "qr", sessionId],
    queryFn: () => adminEventsApi.currentQr(sessionId),
    retry: false,
    enabled: !windowClosed,
    refetchInterval: (query) => (query.state.data?.refreshSeconds ?? 15) * 1000,
  });
  // Outside the class window the API refuses to issue a QR (opens at start, closes at end).
  const qrMessage = notStarted && startMs !== null
    ? `The QR opens automatically at ${fmtDateTime(startMs)} when the class starts.`
    : ended && endMs !== null
      ? `This class ended at ${fmtDateTime(endMs)}. QR check-in is closed.`
      : qr.isError
        ? (qr.error instanceof Error ? qr.error.message : "QR is not available right now.")
        : null;
  // Canvas fits the screen: the card has 16px page gutter + 24px padding + 16px QR padding on each side.
  const qrSize = Math.max(160, Math.min(isFullscreen ? 360 : 260, viewportWidth - 112));

  const attendance = useQuery({
    queryKey: ["admin", "events", "attendance", sessionId],
    queryFn: () => adminEventsApi.attendanceCount(sessionId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!qr.data || !canvasRef.current) return;
    const payload = JSON.stringify({ sessionId, token: qr.data.token });
    void import("qrcode").then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, payload, { 
          width: qrSize, 
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF"
          }
        });
      }
    });
  }, [qr.data, sessionId, isFullscreen, qrSize]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm transition-all ${
        isFullscreen ? "min-h-screen p-12 bg-white" : ""
      }`}
    >
      {/* Top Session Status Bar */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {!qrMessage && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${qrMessage ? "bg-slate-400" : "bg-emerald-500"}`} />
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Radio className={`h-3.5 w-3.5 ${qrMessage ? "text-slate-400" : "text-emerald-600"}`} /> {notStarted ? "QR Opens Soon" : ended ? "Class Ended" : qrMessage ? "QR Not Live" : "Live QR Projection"}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          title="Toggle Fullscreen Projection"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5 text-[#1755A7]" />}
          <span>{isFullscreen ? "Exit Fullscreen" : "Project Fullscreen"}</span>
        </button>
      </div>

      {/* Center QR Canvas Card */}
      <div className="mt-6 flex flex-col items-center">
        {qrMessage ? (
          <div className="flex min-h-[220px] w-full max-w-[292px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:h-[292px]">
            <QrCode className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">{notStarted ? "Not started yet" : ended ? "Check-in closed" : "QR unavailable"}</p>
            <p className="text-xs text-slate-500">{qrMessage}</p>
          </div>
        ) : (
          <div className="relative max-w-full rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-md sm:p-4">
            <canvas ref={canvasRef} className="h-auto max-w-full rounded-xl" />
          </div>
        )}

        {/* Dynamic Rotation Token */}
        {!qrMessage && (
        <div className="mt-5 flex flex-col items-center">
          <div className="rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-1.5 font-mono text-xl font-black tracking-widest text-slate-900 sm:px-6 sm:text-2xl">
            {qr.data?.token ?? "••••"}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin text-[#1755A7]" />
            Rotating dynamic key every {qr.data?.refreshSeconds ?? 15}s
          </p>
        </div>
        )}
      </div>

      {/* Bottom Live Attendance Checked-in Counter */}
      <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <span className="text-xs font-semibold text-slate-500">Live Check-ins:</span>
        <div className="flex items-center gap-1.5 font-mono font-black text-sm text-[#1755A7] bg-[#1755A7]/10 px-3 py-1 rounded-lg">
          <Users className="h-4 w-4" />
          <span>{attendance.data?.count ?? 0} Students Verified</span>
        </div>
      </div>
    </div>
  );
}
