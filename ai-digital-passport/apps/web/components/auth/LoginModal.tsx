"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  GraduationCap, 
  UserCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { authApi } from "../../lib/api";
import { isEmailAuthorized } from "../../lib/whitelist";
import { ErrorBanner } from "../ui/ErrorBanner";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ROLES = [
  {
    role: "Student",
    label: "Student Scholar",
    email: "student@sece.ac.in",
    icon: GraduationCap,
    desc: "Courses, GPU, Hackathons & Points",
  },
  {
    role: "Mentor",
    label: "Faculty Mentor",
    email: "mentor@sece.ac.in",
    icon: UserCheck,
    desc: "Verification Queue & Proctoring",
  },
  {
    role: "Admin",
    label: "System Admin",
    email: "admin@sece.ac.in",
    icon: Shield,
    desc: "Supercluster & Whitelist Control",
  },
];

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const routeBySession = useCallback((roles: string[], onboarded: boolean) => {
    if (!onboarded) router.replace("/onboarding");
    else if (roles.includes("ADMIN")) router.replace("/admin");
    else if (roles.includes("MENTOR")) router.replace("/mentor");
    else router.replace("/dashboard");
  }, [router]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const targetEmail = email.trim();
      const authCheck = isEmailAuthorized(targetEmail);
      if (!authCheck.authorized) {
        setError(new Error(authCheck.reason ?? "Access Denied: Your email is not whitelisted for portal access. Please contact the administrator."));
        setLoading(false);
        return;
      }

      queryClient.clear();
      const targetName = authCheck.entry?.fullName || targetEmail.split("@")[0] || "User";
      await authApi.devLogin({ email: targetEmail, fullName: targetName, password });
      const refreshed = await authApi.session();
      queryClient.setQueryData(["auth", "session"], refreshed);
      onClose();
      routeBySession(refreshed.roles ?? [], !!refreshed.onboarded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }

  function handleQuickSelect(selectedEmail: string) {
    setEmail(selectedEmail);
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-1 border border-slate-200 shadow-2xs">
              <img src="/Eswar.png" alt="Sri Eshwar Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Sri Eshwar NVIDIA</h3>
              <p className="text-[11px] text-slate-500 font-semibold">Sign In to Supercomputing Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Demo Role Selector Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Quick Select Role</span>
            <span className="text-[#1755A7]">Click to Autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {QUICK_ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = email === r.email;
              return (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => handleQuickSelect(r.email)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-[#1755A7] bg-[#1755A7]/5 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-[#1755A7]" : "text-slate-500"}`} />
                  <span className="text-[11px] font-black text-slate-900 leading-tight">{r.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <ErrorBanner error={error} />}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Institutional Email (@sece.ac.in)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@sece.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-2 focus:ring-[#1755A7]/10"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Password</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-2 focus:ring-[#1755A7]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Submit Button */}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1755A7] py-3 text-xs font-bold text-white shadow-md shadow-[#1755A7]/25 hover:bg-[#103E7E] transition-all disabled:opacity-50 active:scale-95"
          >
            <span>{loading ? "Authenticating Session…" : "Sign In with SECE Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Whitelist Security Notice */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center text-[10px] text-slate-500 font-medium">
          🔒 Protected by Sri Eshwar Email Whitelist Governance Subsystem.
        </div>

      </div>
    </div>
  );
}
