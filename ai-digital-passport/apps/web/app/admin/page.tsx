"use client";

import { useQuery } from "@tanstack/react-query";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { ConsoleCard } from "../../components/console/ConsoleCard";
import { ConsolePageHeader } from "../../components/console/ConsolePageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { Spinner } from "../../components/ui/Spinner";
import { adminDashboardApi } from "../../lib/api";
import { Users, FileCheck, Calendar, Briefcase, Flag, Microscope, Building, Medal, BookOpen, Plus } from "lucide-react";

export default function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.summary });

  return (
    <ConsoleShell role="ADMIN">
      <ConsolePageHeader 
        title="Welcome back, Admin!" 
        description="Here's what's happening with your platform today." 
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-[#1A56DB] px-4 py-2 text-[14px] font-medium text-white transition-all hover:bg-[#1E429F]">
            <Plus className="h-4 w-4" />
            Create Hackathon
          </button>
        }
      />

      {summary.isLoading ? (
        <Spinner />
      ) : summary.isError ? (
        <ErrorBanner error={summary.error} />
      ) : summary.data ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Card 1 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Total Students</span>
                <Users className="h-5 w-5 text-[#1A56DB]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">{summary.data.totalStudents.toLocaleString()}</div>
            </ConsoleCard>

            {/* Card 2 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Pending Claims</span>
                <FileCheck className="h-5 w-5 text-[#DC2626]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">{summary.data.pendingClaims.toLocaleString()}</div>
            </ConsoleCard>

            {/* Card 3 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Active Events</span>
                <Calendar className="h-5 w-5 text-[#057A55]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">{summary.data.activeEvents.toLocaleString()}</div>
            </ConsoleCard>

            {/* Card 4 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Total Mentors</span>
                <Briefcase className="h-5 w-5 text-[#D03801]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">12</div>
            </ConsoleCard>

            {/* Card 5 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Active Hackathons</span>
                <Flag className="h-5 w-5 text-[#9061F9]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">3</div>
            </ConsoleCard>

            {/* Card 6 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Research Projects</span>
                <Microscope className="h-5 w-5 text-[#057A55]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">14</div>
            </ConsoleCard>

            {/* Card 7 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Industry Partners</span>
                <Building className="h-5 w-5 text-[#1A56DB]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">8</div>
            </ConsoleCard>

            {/* Card 8 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Awards Granted</span>
                <Medal className="h-5 w-5 text-[#9061F9]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">42</div>
            </ConsoleCard>

            {/* Card 9 */}
            <ConsoleCard className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Active Courses</span>
                <BookOpen className="h-5 w-5 text-[#057A55]" />
              </div>
              <div className="mb-4 text-[24px] font-bold text-ink">28</div>
            </ConsoleCard>
            
          </div>
        </div>
      ) : null}
    </ConsoleShell>
  );
}
