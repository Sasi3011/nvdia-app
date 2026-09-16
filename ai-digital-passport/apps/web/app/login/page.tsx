"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight, Shield, User, GraduationCap, BrainCircuit } from "lucide-react";
import { authApi } from "../../lib/api";
import { useSession } from "../../lib/session";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@sece.ac.in", name: "Admin User", icon: Shield },
  { label: "Mentor", email: "mentor@sece.ac.in", name: "Mentor User", icon: User },
  { label: "Student", email: "student@sece.ac.in", name: "Student User", icon: GraduationCap },
];

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [devError, setDevError] = useState<unknown>(null);
  const [devLoading, setDevLoading] = useState(false);

  const routeBySession = useCallback((roles: string[], onboarded: boolean) => {
    if (!onboarded) router.replace("/onboarding");
    else if (roles.includes("ADMIN")) router.replace("/admin");
    else if (roles.includes("MENTOR")) router.replace("/mentor");
    else router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    if (session.data?.authenticated) {
      routeBySession(session.data.roles ?? [], !!session.data.onboarded);
    }
  }, [session.data, routeBySession]);

  async function handleLogin(e?: React.FormEvent, preset?: { email: string; name: string }) {
    if (e) e.preventDefault();
    setDevError(null);
    setDevLoading(true);
    try {
      queryClient.clear();
      const targetEmail = preset?.email ?? email;
      const targetName = preset?.name ?? (targetEmail.split("@")[0] || "User");
      await authApi.devLogin({ email: targetEmail, fullName: targetName });
      const refreshed = await authApi.session();
      queryClient.setQueryData(["auth", "session"], refreshed);
      routeBySession(refreshed.roles ?? [], !!refreshed.onboarded);
    } catch (err) {
      setDevError(err);
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-surface px-5 py-8 font-sans text-ink">
      <div className="w-full max-w-[370px] flex flex-col">
        
        {/* Title */}
        <div className="mb-8 flex flex-col items-center justify-center gap-3 text-ink">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-multi-color shadow-sm text-white">
            <BrainCircuit size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-center text-display font-bold">
            Sign In
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          {devError ? <ErrorBanner error={devError} /> : null}

          {/* Email Input */}
          <div className="relative flex h-14 w-full items-center rounded-card border border-border bg-white px-5 shadow-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <Mail className="h-5 w-5 shrink-0 text-text-muted" />
            <input
              type="email"
              required
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ml-3.5 h-full w-full border-0 bg-transparent p-0 text-[16px] font-normal text-ink placeholder:text-text-muted focus:outline-none"
            />
          </div>

          {/* Password Input */}
          <div className="relative flex h-14 w-full items-center rounded-card border border-border bg-white px-5 shadow-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <LockKeyhole className="h-5 w-5 shrink-0 text-text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (optional in dev)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ml-3.5 h-full w-full border-0 bg-transparent p-0 text-[16px] font-normal text-ink placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 shrink-0 text-text-muted hover:text-ink"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={devLoading}
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-card border border-accent-deep/20 bg-accent text-[16px] font-semibold text-white shadow-md transition-all hover:bg-accent-deep hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {devLoading ? "Signing in..." : "Login"}
            {!devLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center justify-center gap-2">
          <span className="h-[1px] flex-1 bg-border" />
          <span className="px-2 text-[16px] font-medium text-text-muted">Or</span>
          <span className="h-[1px] flex-1 bg-border" />
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          {/* Continue with Google */}
          <a
            href={authApi.googleLoginUrl()}
            className="flex h-14 w-full items-center justify-center gap-3.5 rounded-card border border-border bg-white text-[14px] font-medium text-ink shadow-sm transition-all hover:bg-surface-muted hover:border-border active:scale-[0.99]"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </a>

          {/* Continue with Apple */}
          <button
            type="button"
            onClick={() => handleLogin(undefined, { email: "apple.student@sece.ac.in", name: "Apple User" })}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-card border border-navy-700 bg-navy-900 text-[14px] font-medium text-ink-inverse shadow-sm transition-all hover:bg-navy-700 active:scale-[0.99]"
          >
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Dev Quick Accounts */}
        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 rounded-card border border-dashed border-border bg-white p-3 text-center">
            <p className="text-[12px] font-semibold text-text-muted">DEV FAST PASS (1-Click Login)</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleLogin(undefined, account)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-white py-2.5 text-[12px] font-semibold text-text-muted shadow-sm transition-all hover:border-accent hover:text-accent"
                  >
                    <Icon className="h-4 w-4" />
                    {account.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Footer info */}
        <p className="mt-6 text-center text-[13px] font-normal text-text-muted">
          NVIDIA AI Digital Passport &bull; SECE
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.5 8.9 5 12 5Z" />
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9Z" />
      <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9v-3.2Z" />
      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.5-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.79 1.1-1.9 0.98-3-.95.04-2.09.64-2.76 1.43-.59.68-1.11 1.78-.97 2.85 1.05.08 2.1-.5 2.75-1.28Z" />
    </svg>
  );
}
