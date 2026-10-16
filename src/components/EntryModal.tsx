import React, { useState, useEffect } from 'react';
import { X, Clock, Coffee, Sparkles, Palmtree, Ban } from 'lucide-react';
import { DayOff, Project, TimeEntry } from '../types/timesheet';
import { calculateNetHours, formatTime12h } from '../utils/dateUtils';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<TimeEntry, 'id'> | TimeEntry) => void;
  editingEntry?: TimeEntry | null;
  defaultDate?: string;
  projects: Project[];
  defaultBreakMinutes: number;
  daysOff?: DayOff[];
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  defaultDate,
  projects,
  defaultBreakMinutes,
  daysOff = [],
}) => {
  const [projectId, setProjectId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(defaultBreakMinutes || 60);
  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingEntry) {
      setProjectId(editingEntry.projectId);
      setDate(editingEntry.date);
      setStartTime(editingEntry.startTime);
      setEndTime(editingEntry.endTime);
      setBreakMinutes(editingEntry.breakMinutes || 0);
      setIsOvertime(!!editingEntry.isOvertime);
      setNotes(editingEntry.notes || '');
    } else {
      const preferred =
        projects.find((p) => p.name.toLowerCase().includes('custom house')) ||
        projects[0];
      setProjectId(preferred?.id || '');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakMinutes(defaultBreakMinutes || 60);
      setIsOvertime(false);
      setNotes('');
    }
  }, [editingEntry, defaultDate, projects, defaultBreakMinutes, isOpen]);

  if (!isOpen) return null;

  const calculatedNet = calculateNetHours(startTime, endTime, breakMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !date || !startTime || !endTime) return;

    if (editingEntry) {
      onSave({
        ...editingEntry,
        projectId,
        date,
        startTime,
        endTime,
        breakMinutes,
        netHours: calculatedNet,
        isOvertime,
        notes: notes.trim() || undefined,
      });
    } else {
      onSave({
        projectId,
        date,
        startTime,
        endTime,
        breakMinutes,
        netHours: calculatedNet,
        isOvertime,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  const applyPreset = (start: string, end: string, brk: number) => {
    setStartTime(start);
    setEndTime(end);
    setBreakMinutes(brk);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {editingEntry ? 'Edit Punch Entry' : 'Log Daily Time Punch'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {/* Quick Schedule Presets */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Standard Construction Shift Presets:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => applyPreset('08:00', '17:00', 60)}
                className="py-1 px-2 text-[11px] font-medium bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                8:00 - 17:00 (8.0h)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('08:00', '16:30', 30)}
                className="py-1 px-2 text-[11px] font-medium bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                8:00 - 16:30 (8.0h)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('08:00', '12:00', 0)}
                className="py-1 px-2 text-[11px] font-medium bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Half Day (4.0h)
              </button>
            </div>
          </div>

          {/* Project & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code && !p.name.includes(p.code)
                      ? `${p.name} (${p.code})`
                      : p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {(() => {
                const dayOff = daysOff.find((d) => d.date === date);
                if (!dayOff) return null;
                const isDidNotWork = Boolean(dayOff.isDidNotWork || dayOff.reason === "Didn't work");
                return (
                  <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                    isDidNotWork ? 'text-rose-800' : 'text-amber-800'
                  }`}>
                    {isDidNotWork ? (
                      <Ban className="w-3 h-3 text-rose-600" />
                    ) : (
                      <Palmtree className="w-3 h-3 text-amber-600" />
                    )}
                    <span>
                      {isDidNotWork
                        ? `Marked as Didn't Work (${dayOff.reason || "Didn't work"})`
                        : `Marked as Day Off (${dayOff.reason})`}
                    </span>
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Punch In (Start)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                {formatTime12h(startTime)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Punch Out (End)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                {formatTime12h(endTime)}
              </span>
            </div>
          </div>

          {/* Unpaid Break Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                Unpaid Meal Break Deduction
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {Math.floor(breakMinutes / 60)} hrs {breakMinutes % 60} min deducted
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-100 rounded-lg">
              {[0, 15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setBreakMinutes(mins)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors text-center ${
                    breakMinutes === mins
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mins === 0 ? '0h 0m' : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculated Net Hours Preview Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <div className="text-xs text-blue-900">
              <span className="font-semibold">Calculated Net Duration:</span>
              <p className="text-[11px] text-blue-700 mt-0.5 font-mono">
                (Start to End) − {Math.floor(breakMinutes / 60)}h {breakMinutes % 60}m unpaid meal break
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-blue-900 tabular-nums">
                {calculatedNet.toFixed(2)} hrs
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                Audited Net Time
              </span>
            </div>
          </div>

          {/* Task / Work Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Work Performed / Punch Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Subfloor joists layout, shear wall framing, electrical rough-in"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Can be included in the Biweekly Audit PDF report.
            </span>
          </div>

          {/* Overtime Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isOvertime"
              checked={isOvertime}
              onChange={(e) => setIsOvertime(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
            />
            <label htmlFor="isOvertime" className="text-xs font-medium text-slate-700">
              Flag as authorized Overtime punch
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {editingEntry ? 'Update Punch' : 'Save Punch Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
