"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { StudentShell } from "../../components/shell/StudentShell";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import { eventsApi, type StudentClassScheduleItem } from "../../lib/api";
import {
  ScanLine,
  Camera,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Radio,
  Search,
} from "lucide-react";

export default function CoeClassesPage() {
  const [isNative, setIsNative] = useState(false);
  const [search, setSearch] = useState("");
  const schedule = useQuery({ queryKey: ["events", "schedule"], queryFn: eventsApi.list });

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const items = schedule.data ?? [];
  const now = Date.now();
  const liveCount = items.filter((e) => e.qrActive).length;
  const attendedCount = items.filter((e) => e.attended).length;
  const upcomingCount = items.filter((e) => new Date(e.endsAt).getTime() >= now).length;

  const filtered = items.filter((e) => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q);
  });
  const upcoming = filtered.filter((e) => new Date(e.endsAt).getTime() >= now);
  const past = filtered.filter((e) => new Date(e.endsAt).getTime() < now);
  const ordered: StudentClassScheduleItem[] = [...upcoming, ...[...past].reverse()];

  return (
    <StudentShell>
      <ConsolePageHeader
        title="CoE Classes"
        description="Scan the live QR code projected in your CoE Class session, or enter the 6-digit code manually, to instantly earn attendance points."
      />

      {/* Top 3 Metric Cards — same visual language as the admin CoE Classes page */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1755A7] via-[#2563EB] to-[#38BDF8]" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Scheduled Classes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1755A7]/15 to-[#2563EB]/10 text-[#1755A7]">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{items.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              {upcomingCount} upcoming
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>QR Refresh:</span>
            <span className="font-bold text-slate-800">Every 30 Seconds</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Live QR Now</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-400/10 text-emerald-600">
              <Radio className={`h-4.5 w-4.5 ${liveCount > 0 ? "animate-pulse" : ""}`} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{liveCount}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {liveCount > 0 ? "Broadcasting" : "None active"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Scanner Engine:</span>
            <span className="font-bold text-[#1755A7]">Hardware & Web</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:border-[#1755A7]/40 hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F8C401] via-amber-500 to-orange-500" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-500">Your Attendance</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{attendedCount}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
              Verified Scans
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Classes attended:</span>
            <span className="font-bold text-slate-800">{attendedCount} of {items.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search scheduled classes or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7]"
          />
        </div>
      </div>

      {/* Class Schedule Table — same layout as the admin CoE Classes page */}
      {schedule.isLoading ? (
        <div className="mt-6 flex h-64 items-center justify-center">
          <Spinner label="Loading class schedule..." />
        </div>
      ) : schedule.isError ? (
        <div className="mt-6"><ErrorBanner error={schedule.error} /></div>
      ) : ordered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No CoE Classes have been scheduled yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {ordered.map((e) => (
              <div key={e.eventId} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${e.isPast ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-[13px] font-bold text-slate-900">{e.title}</h3>
                  <StatusPill item={e} />
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{new Date(e.startsAt).toLocaleDateString()}{e.year ? ` · ${e.year}` : ""}</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {e.sessionType ? ` · ${e.sessionType === "Forenoon" ? "FN" : "AN"}` : ""}
                  </div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#1755A7]" />{e.location || "-"}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Year</th>
                  <th className="px-6 py-3.5">Venue & Location</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordered.map((e) => (
                  <tr key={e.eventId} className={`hover:bg-slate-50/40 transition-colors ${e.isPast ? "opacity-60" : ""}`}>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-900 text-[13px] text-left truncate max-w-[220px] block" title={e.title}>
                        {e.title}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-900">{e.year || "-"}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-[#1755A7]" />
                        {e.location || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(e.startsAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(e.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {e.sessionType && (
                          <span className="inline-flex items-center rounded bg-[#1755A7]/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-[#1755A7]">
                            {e.sessionType === "Forenoon" ? "FN" : "AN"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <StatusPill item={e} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Check-in — single card, switched by the tab buttons on top */}
      <div className="mt-6">
        <CheckInPanel isNative={isNative} />
      </div>
    </StudentShell>
  );
}

function CheckInPanel({ isNative }: { isNative: boolean }) {
  const [mode, setMode] = useState<"scan" | "code">("scan");

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
            mode === "scan"
              ? "bg-[#1755A7] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <Camera className="h-4 w-4" />
          Scan QR
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
            mode === "code"
              ? "bg-[#1755A7] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Enter Code
        </button>
      </div>

      {mode === "scan" ? (isNative ? <NativeScanner /> : <WebCameraScanner />) : <ManualEntry />}
    </div>
  );
}

function StatusPill({ item }: { item: StudentClassScheduleItem }) {
  if (item.attended) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#1755A7]/20 bg-[#1755A7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1755A7]">
        <CheckCircle2 className="h-3 w-3" /> Attended
      </span>
    );
  }
  if (item.qrActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
        <Radio className="h-3 w-3 animate-pulse" /> Live Now
      </span>
    );
  }
  if (item.isPast) {
    return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">Missed</span>;
  }
  return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">Upcoming</span>;
}

type ScanResult = { kind: "success"; message: string } | { kind: "error"; message: string };

function useScanMutation(onResult: (r: ScanResult) => void) {
  return useMutation({
    mutationFn: ({ sessionId, token }: { sessionId?: string; token: string }) =>
      sessionId ? eventsApi.scan(sessionId, token) : eventsApi.scanGlobal(token),
    onSuccess: (res) => {
      if (res.alreadyRecorded) {
        onResult({ kind: "success", message: "Already recorded — you are already checked in for this session." });
      } else {
        onResult({
          kind: "success",
          message: `Check-in verified! +${res.pointsAwarded} points credited to your AI score${res.leveledUp ? " — You leveled up!" : ""}`,
        });
      }
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "This QR code has expired or is invalid. Ask the class host to refresh it.";
      onResult({ kind: "error", message });
    },
  });
}

function parseAndScan(raw: string, scan: ReturnType<typeof useScanMutation>, setResult: (r: ScanResult) => void) {
  try {
    const payload = JSON.parse(raw) as { sessionId?: string; token?: string };
    if (payload.token) {
      // sessionId is optional — the server resolves the active session from the token alone when omitted.
      scan.mutate({ sessionId: payload.sessionId, token: payload.token });
      return;
    }
  } catch {
    // fall through to error below
  }
  setResult({ kind: "error", message: "That QR code is not a valid Sri Eshwar class check-in token." });
}

function NativeScanner() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState<string | false>(false);
  const scan = useScanMutation(setResult);

  const startScan = useCallback(async () => {
    setResult(null);
    try {
      const { BarcodeScanner, BarcodeFormat, GoogleBarcodeScannerModuleInstallState } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!available) {
        setBusy("Installing scanner module…");
        await new Promise<void>((resolve, reject) => {
          BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
            if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) resolve();
            if (event.state === GoogleBarcodeScannerModuleInstallState.FAILED) reject(new Error("install failed"));
            if (event.state === GoogleBarcodeScannerModuleInstallState.CANCELED) reject(new Error("install canceled"));
          });
          void BarcodeScanner.installGoogleBarcodeScannerModule();
        });
        await BarcodeScanner.removeAllListeners();
      }

      setBusy("Opening camera…");
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      const value = barcodes[0]?.rawValue;
      if (!value) {
        setResult({ kind: "error", message: "No QR code detected — please try again." });
        return;
      }
      parseAndScan(value, scan, setResult);
    } catch {
      setResult({ kind: "error", message: "Couldn't open the native camera. Use manual code entry instead." });
    } finally {
      setBusy(false);
    }
  }, [scan]);

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Native Camera Scanner · Google ML Kit hardware barcode scanning</p>

      <div className="p-8 text-center space-y-4 bg-slate-50/60 rounded-xl border border-slate-100">
        <ScanLine className="mx-auto h-12 w-12 text-[#1755A7] animate-pulse" />
        <p className="text-xs text-slate-600 max-w-xs mx-auto">
          Tap below to launch the high-speed system barcode scanner.
        </p>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void startScan()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#134486] transition-all disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          {busy || "Launch Camera Scanner"}
        </button>
      </div>

      {result && (
        <div
          className={`rounded-xl p-3.5 text-xs font-bold flex items-center gap-2.5 ${
            result.kind === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {result.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

function WebCameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const lastDecodedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  const scan = useScanMutation((r) => {
    setResult(r);
    if (r.kind === "success") {
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 5000);
    }
  });

  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data !== lastDecodedRef.current && !cooldownRef.current) {
      lastDecodedRef.current = code.data;
      parseAndScan(code.data, scan, setResult);
    }
  }, [scan]);

  useEffect(() => {
    if (!active) return;
    let raf: number;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const loop = () => {
          void tick();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        setCameraError("Camera permission denied or camera unavailable. Please use manual entry.");
        setActive(false);
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, tick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Web Camera QR Scanner · Live browser camera feed</p>

        <button
          type="button"
          onClick={() => setActive((a) => !a)}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 ${
            active
              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              : "bg-[#1755A7] text-white hover:bg-[#134486]"
          }`}
        >
          {active ? "Stop Camera" : "Start Camera Scanner"}
        </button>
      </div>

      {cameraError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {active ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#1755A7] bg-slate-950 aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder Overlay Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative h-48 w-48 rounded-2xl border-2 border-[#F8C401] shadow-2xl">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-4 border-l-4 border-[#F8C401] -mt-1 -ml-1 rounded-tl-md" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-4 border-r-4 border-[#F8C401] -mt-1 -mr-1 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-4 border-l-4 border-[#F8C401] -mb-1 -ml-1 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-4 border-r-4 border-[#F8C401] -mb-1 -mr-1 rounded-br-md" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-[#F8C401] animate-bounce shadow-lg" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center space-y-3">
          <ScanLine className="mx-auto h-10 w-10 text-slate-400" />
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Click &quot;Start Camera Scanner&quot; above to scan podium QR codes directly with your device webcam.
          </p>
        </div>
      )}

      {result && (
        <div
          className={`rounded-xl p-3.5 text-xs font-bold flex items-center gap-2.5 ${
            result.kind === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {result.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

function ManualEntry() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const scan = useScanMutation(setResult);

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Manual Code Check-in · Enter the 6-digit TOTP code, no Session ID needed</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          scan.mutate({ token });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">6-Digit Dynamic TOTP Token</label>
          <input
            type="text"
            required
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g. 482910"
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono tracking-widest text-slate-900 focus:border-[#1755A7] focus:outline-none text-center font-bold"
          />
        </div>

        <button
          type="submit"
          disabled={scan.isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#134486] disabled:opacity-50 active:scale-95"
        >
          <CheckCircle2 className="h-4 w-4" />
          {scan.isPending ? "Validating Token…" : "Claim Attendance Points"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-xl p-3.5 text-xs font-bold flex items-center gap-2.5 ${
            result.kind === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {result.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
