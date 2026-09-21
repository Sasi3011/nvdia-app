"use client";

import { useState } from "react";
import { Code2, HelpCircle, X, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCoursesApi } from "../../lib/api";
import { Spinner } from "../ui/Spinner";

export function TaskCreationModal({
  courseId,
  courseTitle,
  onClose,
  onFinish
}: {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onFinish: () => void;
}) {
  const [taskType, setTaskType] = useState<"SELECT" | "MCQ" | "PROGRAMMING">("SELECT");
  const [mcqQuestions, setMcqQuestions] = useState([
    { id: "q1", question: "", options: ["", "", "", ""], correctIndex: 0 }
  ]);

  const [progProblem, setProgProblem] = useState("");
  const [progLanguages, setProgLanguages] = useState<string[]>(["Python", "C++", "Java"]);
  const [progEnvironment, setProgEnvironment] = useState("Inbuilt Secure Sandbox (No Outgoing Network)");

  const queryClient = useQueryClient();
  const course = useQuery({ queryKey: ["admin", "course", courseId], queryFn: () => adminCoursesApi.get(courseId) });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => adminCoursesApi.deleteTask(courseId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    }
  });

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#1755A7] focus:outline-none focus:ring-1 focus:ring-[#1755A7] transition-colors";
  const labelClass = "flex flex-col gap-1.5 text-xs font-bold text-slate-700";

  const createTask = useMutation({
    mutationFn: () => {
      let content: any = null;
      let instructions = "";
      
      if (taskType === "MCQ") {
        content = {
          questions: mcqQuestions.map((q, idx) => ({
            id: `q${idx + 1}`,
            question: q.question,
            options: q.options,
            answer: q.options[q.correctIndex],
          }))
        };
      } else if (taskType === "PROGRAMMING") {
        content = {
          problem: progProblem,
          languages: progLanguages,
          environment: progEnvironment,
        };
        instructions = "Write code to solve the problem.";
      }

      return adminCoursesApi.createTask(courseId, {
        title: taskType === "MCQ" ? "MCQ Assessment" : "Programming Challenge",
        type: taskType === "PROGRAMMING" ? "CODING" : taskType,
        instructions,
        content,
        sequenceOrder: (course.data?.tasks?.length || 0) + 1,
        isRequired: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course", courseId] });
      setTaskType("SELECT");
    }
  });

  const handleSave = () => {
    createTask.mutate();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Manage Tasks: {courseTitle}</h3>
            <p className="text-xs text-slate-500">Configure learning assessments</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createTask.isError && (
          <div className="px-6 pt-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-bold">Failed to save task:</span> {String(createTask.error)}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {course.isLoading && <Spinner label="Loading tasks..." />}
          
          {taskType === "SELECT" && !course.isLoading && (
            <div className="flex flex-col gap-6">
              {course.data?.tasks && course.data.tasks.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-slate-800">Existing Tasks</h4>
                  <div className="flex flex-col gap-2">
                    {course.data.tasks.map((t: any, idx: number) => (
                      <div key={t.taskId} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{idx + 1}. {t.title}</span>
                          <span className="text-[10px] font-medium text-slate-500 uppercase">{t.type}</span>
                        </div>
                        <button
                          disabled={deleteTask.isPending}
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this task?")) {
                              deleteTask.mutate(t.taskId);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 my-2" />
                </div>
              )}

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-slate-800 text-center">Add New Task</h4>
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
            <div className="flex flex-col gap-8">
              {mcqQuestions.map((q, qIndex) => (
                <div key={qIndex} className="flex flex-col gap-4 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 relative">
                  {mcqQuestions.length > 1 && (
                    <button 
                      onClick={() => setMcqQuestions(prev => prev.filter((_, i) => i !== qIndex))}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  
                  <h4 className="text-sm font-bold text-[#1755A7]">Question {qIndex + 1}</h4>
                  
                  <label className={labelClass}>
                    <span>Question Content <span className="text-red-500">*</span></span>
                    <textarea 
                      rows={2} 
                      placeholder="Enter the MCQ question here..." 
                      value={q.question} 
                      onChange={(e) => {
                        const newQs = [...mcqQuestions];
                        newQs[qIndex].question = e.target.value;
                        setMcqQuestions(newQs);
                      }} 
                      className={inputClass} 
                    />
                  </label>

                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700">Options (Select the correct one)</span>
                    {q.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name={`correctOption-${qIndex}`} 
                          checked={q.correctIndex === idx} 
                          onChange={() => {
                            const newQs = [...mcqQuestions];
                            newQs[qIndex].correctIndex = idx;
                            setMcqQuestions(newQs);
                          }}
                          className="h-4 w-4 text-[#1755A7]"
                        />
                        <input 
                          placeholder={`Option ${idx + 1}`} 
                          value={opt} 
                          onChange={(e) => {
                            const newQs = [...mcqQuestions];
                            newQs[qIndex].options[idx] = e.target.value;
                            setMcqQuestions(newQs);
                          }} 
                          className={inputClass} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setMcqQuestions(prev => [...prev, { id: `q${prev.length + 1}`, question: "", options: ["", "", "", ""], correctIndex: 0 }])}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500 hover:border-[#1755A7] hover:bg-[#1755A7]/5 hover:text-[#1755A7] transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Another Question
              </button>
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
        {taskType !== "SELECT" ? (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => setTaskType("SELECT")}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button 
              onClick={handleSave}
              disabled={createTask.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1755A7] to-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-[#124282] hover:to-[#1E40AF] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createTask.isPending ? "Saving..." : "Save Task"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={onFinish}
              className="px-4 py-2 text-xs font-bold bg-[#1755A7] text-white rounded-xl shadow-sm hover:bg-[#124282]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
