"use client";

import { useState } from "react";
import { Code2, HelpCircle, X, Plus, Trash2, CheckCircle2 } from "lucide-react";

export function TaskCreationModal({
  courseTitle,
  onClose,
  onFinish
}: {
  courseTitle: string;
  onClose: () => void;
  onFinish: () => void;
}) {
  const [taskType, setTaskType] = useState<"SELECT" | "MCQ" | "PROGRAMMING">("SELECT");
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptions, setMcqOptions] = useState(["", "", "", ""]);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0);

  const [progProblem, setProgProblem] = useState("");
  const [progLanguages, setProgLanguages] = useState<string[]>(["Python", "C++", "Java"]);
  const [progEnvironment, setProgEnvironment] = useState("Inbuilt Secure Sandbox (No Outgoing Network)");

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
  const labelClass = "flex flex-col gap-1.5 text-xs font-bold text-slate-700";

  const handleSave = () => {
    // Here we would typically save the task via API
    // For now, we simulate success and move on
    alert(`Task saved for course: ${courseTitle}`);
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Add Task to {courseTitle}</h3>
            <p className="text-xs text-slate-500">Configure learning assessments</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {taskType === "SELECT" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-700 text-center mb-2">
                Course created successfully! What type of task would you like to add?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTaskType("MCQ")}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 p-6 hover:border-[#1755A7] hover:bg-[#1755A7]/5 transition-all"
                >
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-slate-900">Multiple Choice</span>
                  <span className="text-xs text-slate-500 text-center">Create theoretical assessment questions</span>
                </button>
                <button
                  onClick={() => setTaskType("PROGRAMMING")}
                  className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 p-6 hover:border-[#1755A7] hover:bg-[#1755A7]/5 transition-all"
                >
                  <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-slate-900">Programming</span>
                  <span className="text-xs text-slate-500 text-center">Setup secure coding environment task</span>
                </button>
              </div>
            </div>
          )}

          {taskType === "MCQ" && (
            <div className="flex flex-col gap-5">
              <label className={labelClass}>
                <span>Question Content <span className="text-red-500">*</span></span>
                <textarea 
                  rows={3} 
                  placeholder="Enter the MCQ question here..." 
                  value={mcqQuestion} 
                  onChange={(e) => setMcqQuestion(e.target.value)} 
                  className={inputClass} 
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700">Options (Select the correct one)</span>
                {mcqOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={mcqCorrectIndex === idx} 
                      onChange={() => setMcqCorrectIndex(idx)}
                      className="h-4 w-4 text-[#1755A7]"
                    />
                    <input 
                      placeholder={`Option ${idx + 1}`} 
                      value={opt} 
                      onChange={(e) => {
                        const newOpts = [...mcqOptions];
                        newOpts[idx] = e.target.value;
                        setMcqOptions(newOpts);
                      }} 
                      className={inputClass} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskType === "PROGRAMMING" && (
            <div className="flex flex-col gap-5">
              <label className={labelClass}>
                <span>Problem Statement <span className="text-red-500">*</span></span>
                <textarea 
                  rows={4} 
                  placeholder="Describe the programming problem..." 
                  value={progProblem} 
                  onChange={(e) => setProgProblem(e.target.value)} 
                  className={inputClass} 
                />
              </label>

              <label className={labelClass}>
                <span>Environment Configuration</span>
                <input 
                  disabled 
                  value={progEnvironment} 
                  className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`} 
                />
                <p className="text-[10px] text-slate-400">Students will write and run code in an inbuilt sandbox. No external network requests are allowed.</p>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700">Allowed Languages</span>
                <div className="flex flex-wrap gap-2">
                  {["Python", "C++", "Java", "JavaScript", "Go"].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (progLanguages.includes(lang)) {
                          setProgLanguages(progLanguages.filter(l => l !== lang));
                        } else {
                          setProgLanguages([...progLanguages, lang]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        progLanguages.includes(lang) 
                          ? "bg-[#1755A7] text-white" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {taskType !== "SELECT" && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => setTaskType("SELECT")}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button 
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-[#124282] hover:to-[#1E40AF]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
