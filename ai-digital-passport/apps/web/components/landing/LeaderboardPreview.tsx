"use client";

import Link from "next/link";
import { 
  Trophy, 
  Medal, 
  Crown, 
  ArrowRight, 
  Award
} from "lucide-react";

interface TopStudent {
  rank: number;
  name: string;
  department: string;
  level: number;
  points: number;
  gpuCredits: number;
  badge: string;
}

const TOP_STUDENTS: TopStudent[] = [
  { rank: 1, name: "Aadhithya V.", department: "AI & Data Science (IV)", level: 5, points: 3420, gpuCredits: 620, badge: "Grand Challenge Gold" },
  { rank: 2, name: "Sneha Ramakrishnan", department: "Computer Science (IV)", level: 5, points: 3180, gpuCredits: 540, badge: "Patent Published" },
  { rank: 3, name: "Vikram Sundaram", department: "AI & ML (III)", level: 4, points: 2750, gpuCredits: 380, badge: "Problem Bank Lead" },
  { rank: 4, name: "Pooja Venkatesh", department: "Information Tech (III)", level: 4, points: 2410, gpuCredits: 320, badge: "NeurIPS Preprint" },
  { rank: 5, name: "Rohit Krishnan", department: "Electronics & Comm (IV)", level: 4, points: 2190, gpuCredits: 280, badge: "Buildathon Winner" },
];

export function LeaderboardPreview() {
  return (
    <section className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F8C401]/25 border border-[#F8C401] px-3.5 py-1 text-xs font-black text-slate-900">
              <Trophy className="h-3.5 w-3.5 text-slate-900" />
              <span>CAMPUS HALL OF FAME</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Live Supercomputing Leaderboard
            </h2>
            <p className="text-base text-slate-600">
              Celebrating Sri Eshwar’s top AI builders, researchers, and patent authors pushing the boundaries of GPU computing.
            </p>
          </div>

          <div>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-[#1755A7]/40 transition-all"
            >
              <span>View Full Campus Rankings</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#1755A7]" />
            </Link>
          </div>
        </div>

        {/* Leaderboard Table Preview */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Rank</th>
                  <th scope="col" className="px-6 py-4">Student</th>
                  <th scope="col" className="px-6 py-4">Tier Badge</th>
                  <th scope="col" className="px-6 py-4">Key Distinctions</th>
                  <th scope="col" className="px-6 py-4 text-right">GPU Bank</th>
                  <th scope="col" className="px-6 py-4 text-right">Total Verified XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TOP_STUDENTS.map((student) => {
                  const isGold = student.rank === 1;
                  const isSilver = student.rank === 2;
                  const isBronze = student.rank === 3;

                  return (
                    <tr
                      key={student.rank}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isGold ? "bg-[#F8C401]/10" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isGold && <Crown className="h-5 w-5 text-[#F8C401] fill-[#F8C401]" />}
                          {isSilver && <Medal className="h-5 w-5 text-slate-400 fill-slate-400" />}
                          {isBronze && <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />}
                          {!isGold && !isSilver && !isBronze && (
                            <span className="font-mono text-sm font-bold text-slate-500 pl-1.5">
                              #{student.rank}
                            </span>
                          )}
                          {(isGold || isSilver || isBronze) && (
                            <span className="font-mono text-sm font-black text-slate-900">
                              #{student.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Dept */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.department}</p>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1755A7]/10 px-2.5 py-0.5 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
                          <Award className="h-3 w-3" />
                          L{student.level}
                        </span>
                      </td>

                      {/* Distinctions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200">
                          {student.badge}
                        </span>
                      </td>

                      {/* GPU Bank */}
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-black text-[#1755A7]">
                        {student.gpuCredits} hrs
                      </td>

                      {/* Total XP */}
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-sm font-black text-slate-900">
                        {student.points.toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
