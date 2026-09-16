import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";

// FR-VERIF-01 / Section 13.1: dynamic QR refreshing every N seconds
// (spec default 15s), bound to one session's secret. Each session gets an
// isolated TOTP instance (via .clone()) so a per-session window doesn't
// mutate otplib's shared global config.
export function generateQrSecret(): string {
  return authenticator.generateSecret();
}

function totpFor(windowSeconds: number) {
  return authenticator.clone({ step: windowSeconds, digits: 6 });
}

export function currentToken(secret: string, windowSeconds: number): { token: string; windowStart: Date; windowEnd: Date } {
  const totp = totpFor(windowSeconds);
  const token = totp.generate(secret);
  const now = Date.now();
  const stepMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(now / stepMs) * stepMs;
  return {
    token,
    windowStart: new Date(windowStartMs),
    windowEnd: new Date(windowStartMs + stepMs),
  };
}

// SEC-08: reject expired/invalid tokens. `window: 1` tolerates one step of
// clock/scan latency on either side (Section 13.1 QR Security Controls).
export function verifyToken(token: string, secret: string, windowSeconds: number): boolean {
  const totp = totpFor(windowSeconds);
  totp.options = { ...totp.options, window: 1 };
  try {
    return totp.check(token, secret);
  } catch {
    return false;
  }
}

export function randomOpaqueToken(): string {
  return randomBytes(16).toString("hex");
}
