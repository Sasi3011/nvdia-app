"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Who is eligible for the Sri Eshwar NVIDIA AI Centre Platform?",
    answer: "Any currently enrolled student or faculty member at Sri Eshwar Engineering College with an active @sece.ac.in institutional Google account can log in immediately. Your student profile and compute credits are provisioned automatically on first sign-in."
  },
  {
    question: "How do I earn points and level up from Level 1 to Level 6?",
    answer: "Points are earned across all 9 platform modules: attending weekly Tech Eves (+10 pts), completing accredited DLI or MOOC certifications (+50 to +150 pts), attending GPU Hands-on Fridays (+30 pts), participating in hackathons (+100 to +250 pts), publishing research papers (+150 to +300 pts), and solving Industry Problem Bank challenges (+250 pts). Competency levels unlock automatically as your verified point total crosses each tier threshold."
  },
  {
    question: "How do GPU Compute Credits and Lab Access work?",
    answer: "Starting from Level 2, students gain access to Hands-on Friday GPU workstations. Level 3+ developers unlock dedicated compute quotas (DGX A100 / H100 clusters) for running heavy training workloads, LLM fine-tuning, and research experiments. Quotas scale dynamically with higher levels."
  },
  {
    question: "How does the Live Event QR Scan verification work?",
    answer: "During live sessions like Tech Eves and AI Masterclasses, an ephemeral rolling QR token is projected in the supercomputing auditorium. Scanning the QR via the in-app scanner (/coe-classes) cryptographically validates your in-person presence and credits points instantly without manual mentor review."
  },
  {
    question: "What happens when I submit evidence for courses or hackathons?",
    answer: "Your uploaded certificates, repository links, and project proofs enter the Faculty Mentor Review Queue. Mentors evaluate your submission against rigorous rubrics and either approve (awarding points immediately) or provide detailed feedback for resubmission."
  },
  {
    question: "What are the Annual Supercomputing Fellowships & Awards?",
    answer: "At the end of each academic year, the platform runs an automated institutional audit. Top-ranked Level 5 and Level 6 students are nominated for prestigious institutional fellowships, which include research grants, hardware sponsorships, and direct recruitment pathways with leading AI enterprises."
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="w-full px-6 sm:px-10 lg:px-16">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-base text-slate-600">
            Clear guidelines on points, verification standards, and supercomputing access.
          </p>
        </div>

        {/* Accordion */}
        <div className="mt-12 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-2xs transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-[#1755A7] transition-colors"
                >
                  <span className="text-base pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#1755A7]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
