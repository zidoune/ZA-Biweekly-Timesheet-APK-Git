import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Check, AlertCircle } from 'lucide-react';
import { Project, TimeEntry } from '../types/timesheet';
import { calculateNetHours, toISODateString } from '../utils/dateUtils';
import { ActiveTimerState, loadActiveTimer, saveActiveTimer } from '../utils/storage';

interface LiveTimerBarProps {
  projects: Project[];
  defaultBreakMinutes: number;
  onCommitEntry: (entry: Omit<TimeEntry, 'id'>) => void;
}

export const LiveTimerBar: React.FC<LiveTimerBarProps> = ({
  projects,
  defaultBreakMinutes,
  onCommitEntry,
}) => {
  const defaultProjectId =
    projects.find((p) => p.name.toLowerCase().includes('custom house'))?.id ||
    projects.find((p) => p.name.toLowerCase().includes('residential'))?.id ||
    projects[0]?.id ||
    '';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId);
  const [breakMinutes, setBreakMinutes] = useState<number>(defaultBreakMinutes);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [startTimeISO, setStartTimeISO] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [justSavedNotification, setJustSavedNotification] = useState<string | null>(null);

  // Sync selected project if projects change or invalid
  useEffect(() => {
    const valid = projects.some((p) => p.id === selectedProjectId);
    if (!valid && projects.length > 0) {
      const preferred =
        projects.find((p) => p.name.toLowerCase().includes('custom house')) ||
        projects.find((p) => p.name.toLowerCase().includes('residential'));
      setSelectedProjectId(preferred ? preferred.id : projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Restore saved active timer state on mount
  useEffect(() => {
    const saved = loadActiveTimer();
    if (saved && saved.startTimeISO) {
      setSelectedProjectId(saved.projectId);
      setBreakMinutes(saved.breakMinutes);
      setStartTimeISO(saved.startTimeISO);
      setIsRunning(true);
      const startMs = new Date(saved.startTimeISO).getTime();
      const nowMs = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    }
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && startTimeISO) {
      interval = setInterval(() => {
        const startMs = new Date(startTimeISO).getTime();
        const nowMs = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTimeISO]);

  const handleStart = () => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    const nowISO = new Date().toISOString();
    setStartTimeISO(nowISO);
    setIsRunning(true);
    setElapsedSeconds(0);

    const timerState: ActiveTimerState = {
      projectId: selectedProjectId || projects[0]?.id || '',
      description: '',
      startTimeISO: nowISO,
      breakMinutes,
    };
    saveActiveTimer(timerState);
  };

  const handleStopAndCommit = () => {
    if (!startTimeISO) return;
    const startDate = new Date(startTimeISO);
    const endDate = new Date();

    const startH = startDate.getHours().toString().padStart(2, '0');
    const startM = startDate.getMinutes().toString().padStart(2, '0');
    const startTimeStr = `${startH}:${startM}`;

    const endH = endDate.getHours().toString().padStart(2, '0');
    const endM = endDate.getMinutes().toString().padStart(2, '0');
    const endTimeStr = `${endH}:${endM}`;

    const todayDateISO = toISODateString(endDate);
    const net = calculateNetHours(startTimeStr, endTimeStr, breakMinutes);

    onCommitEntry({
      projectId: selectedProjectId || projects[0]?.id || '',
      date: todayDateISO,
      startTime: startTimeStr,
      endTime: endTimeStr,
      breakMinutes,
      netHours: net,
    });

    // Reset timer
    setIsRunning(false);
    setStartTimeISO(null);
    setElapsedSeconds(0);
    saveActiveTimer(null);

    setJustSavedNotification(`Saved ${net.toFixed(2)} hrs (${startTimeStr} - ${endTimeStr})`);
    setTimeout(() => {
      setJustSavedNotification(null);
    }, 4000);
  };

  const formatTimerDigits = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Input controls & Project selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
          {/* Project Dropdown */}
          <div className="w-full sm:w-60">
            <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Active Project
            </label>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={isRunning}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-5 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code && !p.name.includes(p.code)
                      ? `${p.name} (${p.code})`
                      : p.name}
                  </option>
                ))}
              </select>
              {currentProject && (
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full pointer-events-none"
                  style={{ backgroundColor: currentProject.color }}
                />
              )}
            </div>
          </div>

          {/* Unpaid Break Quick Deduction */}
          <div className="w-full sm:w-56">
            <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-600" />
              Meal Break
            </label>
            <select
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            >
              <option value={0}>0 hours 0 min (No break)</option>
              <option value={15}>0 hours 15 min break</option>
              <option value={30}>0 hours 30 min unpaid break</option>
              <option value={45}>0 hours 45 min unpaid break</option>
              <option value={60}>1 hour 0 min unpaid break</option>
              <option value={75}>1 hour 15 min unpaid break</option>
              <option value={90}>1 hour 30 min unpaid break</option>
            </select>
          </div>
        </div>

        {/* Right: Timer Display & Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="text-left sm:text-right shrink-0">
            <div
              className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
                isRunning ? 'text-blue-600 animate-pulse' : 'text-slate-800'
              }`}
            >
              {formatTimerDigits(elapsedSeconds)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {isRunning ? 'Live Stopwatch Running' : 'Punch Clock Idle'}
            </div>
          </div>

          {isRunning ? (
            <button
              type="button"
              onClick={handleStopAndCommit}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-xs transition-all shrink-0 min-h-[38px]"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop & Save</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 shadow-xs transition-all shrink-0 min-h-[38px]"
            >
              <Play className="w-4 h-4 fill-current text-emerald-400" />
              <span>Start Punch</span>
            </button>
          )}
        </div>
      </div>

      {justSavedNotification && (
        <div className="mt-3 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Time recorded successfully! {justSavedNotification}</span>
          </div>
          <span className="text-[11px] text-emerald-600">Added to today's log</span>
        </div>
      )}
    </div>
  );
};
