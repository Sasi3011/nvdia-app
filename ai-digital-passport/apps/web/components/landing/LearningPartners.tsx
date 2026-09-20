"use client";

import { 
  GraduationCap, 
  CheckCircle2, 
  Cpu
} from "lucide-react";

interface Provider {
  name: string;
  type: string;
  focus: string;
  badge: string;
}

const CANONICAL_PROVIDERS: Provider[] = [
  { name: "NVIDIA DLI", type: "Deep Learning Institute", focus: "GPU Supercomputing, LLMs & TensorRT", badge: "Primary" },
  { name: "NPTEL", type: "IIT / IISc MOOCs", focus: "Core AI, Discrete Maths & Algorithmic Foundations", badge: "Academic" },
  { name: "Coursera", type: "Global Specializations", focus: "DeepLearning.AI & Frontier Models", badge: "Specialized" },
  { name: "Hugging Face", type: "Open Source AI", focus: "Transformers, Diffusion & Fine-Tuning", badge: "Frontier" },
  { name: "AWS Training", type: "Cloud Supercomputing", focus: "SageMaker, Distributed Training & MLOps", badge: "Cloud" },
  { name: "Google Cloud", type: "Enterprise AI", focus: "Vertex AI, TPU Acceleration & BigQuery ML", badge: "Cloud" },
  { name: "Microsoft Learn", type: "Enterprise ML", focus: "Azure OpenAI & Cognitive Services", badge: "Enterprise" },
  { name: "Kaggle", type: "Data Science", focus: "Competitive Modeling & Grandmaster Notebooks", badge: "Competitive" },
  { name: "GitHub", type: "Developer Skills", focus: "Open-source contributions & Git CI/CD", badge: "Code" },
  { name: "LeetCode", type: "Algorithms", focus: "Data Structures & Computational Problem Solving", badge: "Code" },
  { name: "Cisco", type: "Infrastructure", focus: "AI Data Center Networking & Fabric", badge: "Network" },
];

export function LearningPartners() {
  return (
    <section id="ecosystem" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center w-full space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1755A7]/10 px-3.5 py-1 text-xs font-bold text-[#1755A7] border border-[#1755A7]/20">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>CANONICAL LEARNING ECOSYSTEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            11 Approved Global Learning Platforms
          </h2>
          <p className="text-base text-slate-600">
            Course credentials from these accredited providers are seamlessly recognized, reviewed by faculty mentors, and converted to verified competency points.
          </p>
        </div>

        {/* Providers Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CANONICAL_PROVIDERS.map((prov, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border-2 border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md hover:border-[#1755A7]/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-900">{prov.name}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                    {prov.badge}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#1755A7] mt-1">{prov.type}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {prov.focus}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Categorized
                </span>
                <span className="font-mono font-bold text-slate-900">+50 - 150 pts</span>
              </div>
            </div>
          ))}

          {/* Admin Extensibility Card */}
          <div className="flex flex-col justify-between rounded-xl border-2 border-dashed border-[#1755A7]/40 bg-[#1755A7]/5 p-4">
            <div>
              <div className="flex items-center gap-2 text-[#1755A7] font-extrabold text-sm">
                <Cpu className="h-4 w-4" />
                <span>Extensible Registry</span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Faculty & Admin councils can whitelist additional emerging platforms and specialized AI labs as new standards emerge.
              </p>
            </div>
            <div className="mt-4 text-[11px] font-bold text-[#1755A7]">
              Dynamic Database Registry
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
