"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { StudentShell } from "../../components/shell/StudentShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { ApiError } from "../../lib/api-client";
import { eventsApi } from "../../lib/api";

/**
 * Page 17 — Live Event QR Scan (spec 02 Section 6.2). Native camera flow
 * on the Capacitor-wrapped Android/iOS app (Phase 7,
 * @capacitor-mlkit/barcode-scanning — real ML Kit scanning, not a webview
 * camera hack); a webcam-based scanner with jsQR on plain web; manual
 * token entry always available as a fallback either way. All three paths
 * call the exact same POST /events/:id/scan contract (spec 05 Section 17
 * — kept generic on purpose).
 *
 * QR payload format (not spec-given — a design decision made here, matched
 * by the admin QR display built in Phase 6):
 *   {"sessionId": "<event_session id>", "token": "<6-digit TOTP code>"}
 */
export default function ScanPage() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return (
    <StudentShell>
      <PageHeader title="Scan" description="Scan the live QR code, or enter it manually." />
      <div className="flex flex-col gap-6">
        {isNative ? <NativeScanner /> : <WebCameraScanner />}
        <ManualEntry />
      </div>
    </StudentShell>
  );
}

type ScanResult = { kind: "success"; message: string } | { kind: "error"; message: string };

function useScanMutation(onResult: (r: ScanResult) => void) {
  return useMutation({
    mutationFn: ({ sessionId, token }: { sessionId: string; token: string }) => eventsApi.scan(sessionId, token),
    onSuccess: (res) => {
      if (res.alreadyRecorded) {
        onResult({ kind: "success", message: "Already recorded — you're checked in for this session." });
      } else {
        onResult({
          kind: "success",
          message: `Checked in! +${res.pointsAwarded} points${res.leveledUp ? " — you leveled up!" : ""}`,
        });
      }
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "This QR code has expired. Ask the event host to refresh it.";
      onResult({ kind: "error", message });
    },
  });
}

function parseAndScan(raw: string, scan: ReturnType<typeof useScanMutation>, setResult: (r: ScanResult) => void) {
  try {
    const payload = JSON.parse(raw) as { sessionId?: string; token?: string };
    if (payload.sessionId && payload.token) {
      scan.mutate({ sessionId: payload.sessionId, token: payload.token });
      return;
    }
  } catch {
    // fall through to error below
  }
  setResult({ kind: "error", message: "That QR code isn't a valid event check-in code." });
}

// Native camera scan — Google Play Services' bundled ML Kit scanning UI
// (@capacitor-mlkit/barcode-scanning's `scan()`), a full-screen system
// scanner activity, not a webview `getUserMedia` hack. Per the plugin's
// own docs this path needs no camera permission (Google Play Services
// handles it internally) — it does need the Google Barcode Scanner module
// installed first, which is what the availability check below is for.
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
        setBusy("Installing scanner…");
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
        setResult({ kind: "error", message: "No QR code detected — try again." });
        return;
      }
      parseAndScan(value, scan, setResult);
    } catch {
      setResult({ kind: "error", message: "Couldn't open the camera. Use manual entry below instead." });
    } finally {
      setBusy(false);
    }
  }, [scan]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-ink">Camera</h2>
        <Button variant="primary" disabled={!!busy} onClick={() => void startScan()} className="min-h-[44px]">
          {busy || "Scan QR code"}
        </Button>
      </div>
      {result ? (
        <div className={"mt-4 rounded-card px-4 py-3 text-body " + (result.kind === "success" ? "bg-accent/10 text-accent-deep" : "bg-rejected/10 text-rejected")}>
          {result.message}
        </div>
      ) : null}
    </Card>
  );
}

// Web fallback — webcam + jsQR, used only outside the native app shell.
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
        setCameraError("Couldn't access the camera. Use manual entry below instead.");
        setActive(false);
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, tick]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-ink">Camera</h2>
        <Button variant={active ? "destructive" : "primary"} onClick={() => setActive((a) => !a)} className="min-h-[44px]">
          {active ? "Stop camera" : "Start camera"}
        </Button>
      </div>

      {cameraError ? <p className="mt-3 text-body text-rejected">{cameraError}</p> : null}

      {active ? (
        <div className="relative mt-4 overflow-hidden rounded-card border border-border">
          <video ref={videoRef} className="w-full" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : null}

      {result ? (
        <div className={"mt-4 rounded-card px-4 py-3 text-body " + (result.kind === "success" ? "bg-accent/10 text-accent-deep" : "bg-rejected/10 text-rejected")}>
          {result.message}
        </div>
      ) : null}
    </Card>
  );
}

function ManualEntry() {
  const [sessionId, setSessionId] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const scan = useScanMutation(setResult);

  return (
    <Card>
      <h2 className="text-h2 text-ink">Manual entry</h2>
      <p className="mt-1 text-caption text-text-muted">If the camera isn&apos;t available, enter the code shown at the event.</p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          scan.mutate({ sessionId, token });
        }}
      >
        <input
          required
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID"
          className="min-h-[44px] rounded-card border border-border px-3 py-2 text-body"
        />
        <input
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="6-digit code"
          inputMode="numeric"
          className="min-h-[44px] rounded-card border border-border px-3 py-2 text-body"
        />
        <Button type="submit" variant="primary" disabled={scan.isPending} className="min-h-[44px]">
          {scan.isPending ? "Checking in…" : "Check in"}
        </Button>
      </form>
      {result ? (
        <div className={"mt-4 rounded-card px-4 py-3 text-body " + (result.kind === "success" ? "bg-accent/10 text-accent-deep" : "bg-rejected/10 text-rejected")}>
          {result.message}
        </div>
      ) : null}
    </Card>
  );
}
