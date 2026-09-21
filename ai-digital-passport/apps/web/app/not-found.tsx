"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";



export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#1755A7]/10 via-blue-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 text-center">
        {/* Animated Status Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 shadow-sm mb-8">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <AlertTriangle className="h-3.5 w-3.5" />
          SYSTEM ERROR A ROUTE NOT FOUND
        </div>

        {/* Huge 404 Text */}
        <h1 className="text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#1755A7] via-[#2563EB] to-[#F8C401] drop-shadow-sm select-none">
          404
        </h1>

        <div className="mt-2 space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            This module doesn't exist.
          </h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            The resource you're navigating to has been moved or never existed on this platform. 
            Check your URL or jump back into a valid cluster node below.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1755A7] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#1755A7]/25 transition-all hover:bg-[#103E7E] active:scale-95"
          >
            Return to Base
          </Link>
        </div>

      </div>
    </div>
  );
}
