"use client";

import { ConsoleShell } from "../../../components/console/ConsoleShell";
import { Lock } from "lucide-react";

export default function AdminGpuPage() {
  return (
    <ConsoleShell role="ADMIN">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-6 border-4 border-white shadow-sm">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          GPU Cluster Access Locked
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The NVIDIA DGX Supercomputing Cluster management interface is currently under development. Access will be unlocked in an upcoming portal update.
        </p>
      </div>
    </ConsoleShell>
  );
}
