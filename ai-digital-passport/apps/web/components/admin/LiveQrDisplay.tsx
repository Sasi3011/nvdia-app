"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminEventsApi } from "../../lib/api";
import { QrCode, Users, RefreshCw, Sparkles, Maximize2, Minimize2, Radio } from "lucide-react";

export function LiveQrDisplay({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const qr = useQuery({
    queryKey: ["admin", "events", "qr", sessionId],
    queryFn: () => adminEventsApi.currentQr(sessionId),
    refetchInterval: (query) => (query.state.data?.refreshSeconds ?? 15) * 1000,
  });

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
          width: isFullscreen ? 360 : 260, 
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF"
          }
        });
      }
    });
  }, [qr.data, sessionId, isFullscreen]);

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
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition-all ${
        isFullscreen ? "min-h-screen p-12 bg-white" : ""
      }`}
    >
      {/* Top Session Status Bar */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 text-emerald-600" /> Live QR Projection
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
        <div className="relative p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-md">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        {/* Dynamic Rotation Token */}
        <div className="mt-5 flex flex-col items-center">
          <div className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-slate-50 border border-slate-200/90 px-6 py-1.5 rounded-xl">
            {qr.data?.token ?? "••••"}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin text-[#1755A7]" />
            Rotating dynamic key every {qr.data?.refreshSeconds ?? 15}s
          </p>
        </div>
      </div>

      {/* Bottom Live Attendance Checked-in Counter */}
      <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Live Check-ins:</span>
        <div className="flex items-center gap-1.5 font-mono font-black text-sm text-[#1755A7] bg-[#1755A7]/10 px-3 py-1 rounded-lg">
          <Users className="h-4 w-4" />
          <span>{attendance.data?.count ?? 0} Students Verified</span>
        </div>
      </div>
    </div>
  );
}
