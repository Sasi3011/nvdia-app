"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight
} from "lucide-react";
import { authApi } from "../../lib/api";
import { useSession } from "../../lib/session";
import { isEmailAuthorized } from "../../lib/whitelist";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { GoogleIcon } from "../../components/ui/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [devError, setDevError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setDevError(null);
    setLoading(true);
    try {
      const targetEmail = email.trim();
      const authCheck = isEmailAuthorized(targetEmail);
      if (!authCheck.authorized) {
        setDevError(new Error(authCheck.reason || "Access Denied: Your email is not whitelisted for portal access. Please contact the administrator to grant access."));
        setLoading(false);
        return;
      }

      queryClient.clear();
      const targetName = authCheck.entry?.fullName || targetEmail.split("@")[0] || "User";
      await authApi.devLogin({ email: targetEmail, fullName: targetName, password });
      const refreshed = await authApi.session();
      queryClient.setQueryData(["auth", "session"], refreshed);
      routeBySession(refreshed.roles ?? [], !!refreshed.onboarded);
    } catch (err) {
      setDevError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] px-4 py-8 font-sans">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#1755A7]/8 via-[#F8C401]/5 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[420px] flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105 mb-3">
            <img 
              src="/Eswar.png" 
              alt="Sri Eshwar Logo" 
              className="h-12 w-auto object-contain" 
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign In to Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sri Eshwar NVIDIA AI Centre
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full rounded-2xl bg-white border border-slate-200/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          
          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {devError ? <ErrorBanner error={devError} /> : null}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Institutional Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@sece.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#1755A7] focus:outline-none focus:ring-4 focus:ring-[#1755A7]/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#1755A7] focus:outline-none focus:ring-4 focus:ring-[#1755A7]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1755A7] text-sm font-semibold text-white shadow-sm shadow-[#1755A7]/20 transition-all hover:bg-[#124282] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 font-medium text-slate-400">or</span>
            </div>
          </div>

          {/* Google SSO Button */}
          <a
            href={authApi.googleLoginUrl()}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99]"
          >
            <GoogleIcon />
            <span>Continue with Google (@sece.ac.in)</span>
          </a>

        </div>

        {/* Footer info */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Sri Eshwar Engineering College &bull; Restricted to @sece.ac.in
        </p>

      </div>
    </main>
  );
}
