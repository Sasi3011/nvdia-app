"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { StudentShell } from "../../components/shell/StudentShell";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";
import { eventsApi, type StudentClassScheduleItem } from "../../lib/api";
import {
  ScanLine,
  Sparkles,
  Camera,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  MapPin,
  Radio
} from "lucide-react";

export default function CoeClassesPage() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return (
    <StudentShell>
      <div className="space-y-6">

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-[#1755A7]" />
              CoE Classes
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Scan the live QR code projected in your CoE Class session, or enter the 6-digit code manually, to instantly earn attendance points for your AI competence score.
            </p>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance Points Bounty</div>
            <div className="mt-2 text-2xl font-black text-amber-600">+50 - 150 pts</div>
            <div className="mt-1 text-xs text-slate-500">Credited instantly on check-in</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">QR Code Security</div>
            <div className="mt-2 text-2xl font-black text-[#1755A7]">TOTP Dynamic</div>
            <div className="mt-1 text-xs text-slate-500">Rotates every 30 seconds</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scanner Engine</div>
            <div className="mt-2 text-2xl font-black text-emerald-600">Hardware & Web</div>
            <div className="mt-1 text-xs text-slate-500">Auto-detects device platform</div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit Status</div>
            <div className="mt-2 text-2xl font-black text-slate-900">Auto-Verified</div>
            <div className="mt-1 text-xs text-slate-500">Cryptographically signed check-in</div>
          </div>
        </div>

        {/* Class Schedule */}
        <ClassSchedule />

        {/* Scanner & Manual Entry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isNative ? <NativeScanner /> : <WebCameraScanner />}
          <ManualEntry />
        </div>

      </div>
    </StudentShell>
  );
}

function ClassSchedule() {
  const schedule = useQuery({ queryKey: ["events", "schedule"], queryFn: eventsApi.list });
  const items = schedule.data ?? [];
  const now = Date.now();
  const upcoming = items.filter((e) => new Date(e.endsAt).getTime() >= now);
  const past = items.filter((e) => new Date(e.endsAt).getTime() < now);
  // Upcoming first (soonest first), then recent past (most recent first).
  const ordered: StudentClassScheduleItem[] = [...upcoming, ...[...past].reverse()];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center gap-2.5 p-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">Class Schedule</h2>
          <p className="text-[11px] text-slate-500">Every scheduled CoE Class, live sessions highlighted</p>
        </div>
      </div>

      {schedule.isLoading ? (
        <div className="p-8 text-center"><Spinner label="Loading class schedule…" /></div>
      ) : schedule.isError ? (
        <div className="p-5"><ErrorBanner error={schedule.error} /></div>
      ) : ordered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">No CoE Classes have been scheduled yet.</div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {ordered.map((e) => (
            <div key={e.eventId} className={`flex items-center justify-between gap-4 p-4 ${e.isPast ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 truncate">{e.title}</span>
                  {e.qrActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <Radio className="h-2.5 w-2.5 animate-pulse" /> Live Now
                    </span>
                  )}
                  {e.attended && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2 py-0.5 text-[10px] font-bold text-[#1755A7]">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Attended
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                  <span>
                    {new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(e.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                  )}
                  {e.sessionType && <span>{e.sessionType}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Native Camera Scanner</h2>
            <p className="text-[11px] text-slate-500">Google ML Kit hardware barcode scanning</p>
          </div>
        </div>
      </div>

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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1755A7]/10 text-[#1755A7]">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Web Camera QR Scanner</h2>
            <p className="text-[11px] text-slate-500">Live browser camera feed</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActive((a) => !a)}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 ${
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">Manual Code Check-in</h2>
          <p className="text-[11px] text-slate-500">Enter the 6-digit TOTP code — no Session ID needed</p>
        </div>
      </div>

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
