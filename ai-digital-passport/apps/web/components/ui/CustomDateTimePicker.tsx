import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

interface CustomDateTimePickerProps {
  value: string; // ISO string like "2024-09-21T10:00"
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export function CustomDateTimePicker({
  value,
  onChange,
  className = "",
  placeholder = "Select Date & Time",
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize state from value
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? initialDate : null);

  // Time state
  const [hours, setHours] = useState(
    value ? (initialDate.getHours() % 12 || 12).toString().padStart(2, "0") : "12"
  );
  const [minutes, setMinutes] = useState(
    value ? initialDate.getMinutes().toString().padStart(2, "0") : "00"
  );
  const [ampm, setAmpm] = useState(value ? (initialDate.getHours() >= 12 ? "PM" : "AM") : "AM");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    updateValue(newDate, hours, minutes, ampm);
  };

  const updateValue = (date: Date | null, h: string, m: string, ap: string) => {
    if (!date) return;
    let hourInt = parseInt(h, 10);
    if (ap === "PM" && hourInt < 12) hourInt += 12;
    if (ap === "AM" && hourInt === 12) hourInt = 0;
    
    const finalDate = new Date(date);
    finalDate.setHours(hourInt, parseInt(m, 10), 0, 0);
    
    // Format to ISO string slice for datetime-local format: YYYY-MM-DDTHH:mm
    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, "0");
    const day = String(finalDate.getDate()).padStart(2, "0");
    const hr = String(finalDate.getHours()).padStart(2, "0");
    const min = String(finalDate.getMinutes()).padStart(2, "0");
    
    onChange(`${year}-${month}-${day}T${hr}:${min}`);
  };

  // Calendar logic
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const formatDisplay = () => {
    if (!value || !selectedDate) return placeholder;
    return `${selectedDate.toLocaleDateString()} ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none h-full gap-2 px-3 py-2 border rounded-xl bg-white border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate">{formatDisplay()}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm text-slate-800">
              {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4 text-center text-xs font-bold text-slate-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-[#1755A7] text-white"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
            <Clock className="h-4 w-4 text-slate-400" />
            <select
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                updateValue(selectedDate, e.target.value, minutes, ampm);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none bg-slate-50 cursor-pointer text-slate-700"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const val = String(i + 1).padStart(2, "0");
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
            <span className="font-bold text-slate-400">:</span>
            <select
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                updateValue(selectedDate, hours, e.target.value, ampm);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none bg-slate-50 cursor-pointer text-slate-700"
            >
              {["00", "15", "30", "45"].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <select
              value={ampm}
              onChange={(e) => {
                setAmpm(e.target.value);
                updateValue(selectedDate, hours, minutes, e.target.value);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none bg-slate-50 cursor-pointer text-[#1755A7]"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
