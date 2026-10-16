import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { DayOff, DaySchedule, Project, TimeEntry, TimesheetProfile } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';
import { getBiweeklyDays } from '../utils/dateUtils';

interface DailyHoursChartProps {
  entries: TimeEntry[];
  projects: Project[];
  profile: TimesheetProfile;
  daysOff?: DayOff[];
  periodDateSet?: Set<string>;
  periodDays?: DaySchedule[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  selectedTab?: 'all' | 'w1' | 'w2';
  onTabChange?: (tab: 'all' | 'w1' | 'w2') => void;
}

export const DailyHoursChart: React.FC<DailyHoursChartProps> = ({
  entries,
  projects,
  profile,
  daysOff = [],
  periodDateSet,
  periodDays: propPeriodDays,
  isExpanded: controlledExpanded,
  onToggleExpand,
  selectedTab: controlledTab,
  onTabChange,
}) => {
  const { t, language } = useLanguage();
  const [internalExpanded, setInternalExpanded] = useState<boolean>(false);
  const [internalTab, setInternalTab] = useState<'all' | 'w1' | 'w2'>('all');

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = onToggleExpand || (() => setInternalExpanded((prev) => !prev));

  const viewTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setViewTab = onTabChange || setInternalTab;

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const dayOffMap = useMemo(() => {
    const map = new Map<string, DayOff>();
    daysOff.forEach((d) => map.set(d.date, d));
    return map;
  }, [daysOff]);

  const periodDays = useMemo(() => {
    if (propPeriodDays && propPeriodDays.length > 0) return propPeriodDays;
    if (periodDateSet && periodDateSet.size > 0) {
      const sorted = Array.from(periodDateSet).sort();
      return getBiweeklyDays(sorted[0], language === 'fr' ? 'fr-CA' : 'en-CA');
    }
    return getBiweeklyDays('2026-10-05', language === 'fr' ? 'fr-CA' : 'en-CA');
  }, [propPeriodDays, periodDateSet, language]);

  const standardDailyTarget = profile.dailyStandardHours || 8.0;

  const chartData = useMemo(() => {
    return periodDays.map((day) => {
      const dayEntries = entries.filter((e) => e.date === day.date);
      const rawNet = dayEntries.reduce((sum, e) => sum + e.netHours, 0);
      const dayOff = dayOffMap.get(day.date);
      const isDidNotWork = Boolean(dayOff?.isDidNotWork || dayOff?.reason === "Didn't work");
      const isDayOff = Boolean(dayOff);
      const isScheduledDayOff = Boolean(dayOff && !isDidNotWork);

      // Unworked hours (Days Off, Leave, Didn't Work) are NOT counted in worked hours
      const workedHours = isDayOff ? 0 : rawNet;
      const targetHours = day.isWorkday && !isDayOff ? standardDailyTarget : 0;

      const dayNumber = day.date.split('-')[2];
      const shortDayName = day.dayName.slice(0, 3);
      const dayLabel = `${shortDayName} ${dayNumber}`;

      const overtimeHours = Math.max(0, workedHours - standardDailyTarget);
      const variance = workedHours - targetHours;
      const isTargetMet = workedHours >= standardDailyTarget && day.isWorkday && !isDayOff;

      const projectsWorked = Array.from(
        new Set(
          dayEntries.map((e) => {
            const p = projectMap.get(e.projectId);
            return p?.name || 'Project';
          })
        )
      );

      return {
        date: day.date,
        formattedDate: day.formattedDate,
        dayName: day.dayName,
        dayLabel,
        weekNumber: day.weekNumber,
        isWeekend: day.isWeekend,
        isWorkday: day.isWorkday,
        isDayOff: Boolean(dayOff),
        isDidNotWork,
        isScheduledDayOff,
        dayOffReason: dayOff?.reason,
        workedHours: Number(workedHours.toFixed(2)),
        targetHours: Number(targetHours.toFixed(1)),
        standardDailyTarget,
        variance: Number(variance.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        isTargetMet,
        entryCount: dayEntries.length,
        projectsWorked,
      };
    });
  }, [periodDays, entries, dayOffMap, standardDailyTarget, projectMap]);

  const displayedChartData = useMemo(() => {
    if (viewTab === 'w1') return chartData.filter((d) => d.weekNumber === 1);
    if (viewTab === 'w2') return chartData.filter((d) => d.weekNumber === 2);
    return chartData;
  }, [chartData, viewTab]);

  const targetWorkdaysInView = displayedChartData.filter((d) => d.isWorkday && !d.isScheduledDayOff && !d.isDidNotWork);
  const metTargetCount = targetWorkdaysInView.filter((d) => d.workedHours >= standardDailyTarget).length;
  const viewWorkedTotal = displayedChartData.reduce((acc, d) => acc + d.workedHours, 0);
  const viewTargetTotal = displayedChartData.reduce((acc, d) => acc + d.targetHours, 0);

  const totalPeriodWorkedHours = chartData.reduce((acc, d) => acc + d.workedHours, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const diff = data.workedHours - data.targetHours;
    const isPositive = diff > 0;
    const isZero = diff === 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs min-w-[210px] z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
          <div>
            <span className="font-bold text-white text-xs">{data.dayName}, {data.formattedDate}</span>
            <span className="text-[10px] text-slate-400 block font-mono">{data.date}</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
            data.isScheduledDayOff
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : data.isDidNotWork
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : data.isWeekend
              ? 'bg-slate-800 text-slate-400'
              : data.isTargetMet
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          }`}>
            {data.isScheduledDayOff
              ? (data.dayOffReason || 'Day Off')
              : data.isDidNotWork
              ? (data.dayOffReason || "Didn't Work")
              : data.isWeekend
              ? 'Weekend'
              : data.isTargetMet
              ? (language === 'fr' ? 'Objectif atteint' : 'Target Met')
              : (language === 'fr' ? 'Jour ouvré' : 'Workday')}
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-sans text-xs">{t.chartWorkedHours}:</span>
            <span className={`font-bold text-sm tabular-nums ${data.workedHours === 0 ? 'text-slate-400' : 'text-white'}`}>
              {data.workedHours.toFixed(2)}h
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400 font-sans text-xs">{t.chartStandardTarget}:</span>
            <span className="tabular-nums">{data.targetHours.toFixed(1)}h</span>
          </div>

          {data.targetHours > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400 font-sans">{t.chartVariance}:</span>
              <span className={`font-semibold tabular-nums ${
                isPositive ? 'text-emerald-400' : isZero ? 'text-slate-300' : 'text-amber-400'
              }`}>
                {isPositive ? `+${diff.toFixed(2)}h` : isZero ? '0.00h (Met)' : `${diff.toFixed(2)}h`}
              </span>
            </div>
          )}

          {data.overtimeHours > 0 && (
            <div className="flex justify-between items-center text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
              <span className="font-sans">Daily OT (&gt;8h):</span>
              <span className="font-bold">+{data.overtimeHours.toFixed(2)}h</span>
            </div>
          )}
        </div>

        {data.projectsWorked && data.projectsWorked.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400 block mb-1">Projects:</span>
            <div className="flex flex-wrap gap-1">
              {data.projectsWorked.map((pName: string, idx: number) => (
                <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 truncate max-w-[170px]">
                  {pName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="daily-hours-chart-section" className="space-y-2">
      {/* Show/Hide Toggle Control Bar positioned right above the chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {t.chartTitle}
              </h3>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                totalPeriodWorkedHours === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {totalPeriodWorkedHours.toFixed(2)}h {language === 'fr' ? 'total' : 'logged'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {t.chartSubtitle}
            </p>
          </div>
        </div>

        {/* Action Toggle Button */}
        <button
          type="button"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 shadow-2xs self-start sm:self-auto ${
            isExpanded
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-xs'
          }`}
        >
          {isExpanded ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>{t.hideChartBtn}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>{t.showChartBtn}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Visual Analytics Chart Body - only visible when expanded */}
      {isExpanded && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4.5 shadow-xs transition-all animate-in fade-in duration-200">
          {/* Card Header with Legend & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {language === 'fr' ? 'Graphique quotidien des heures' : 'Daily Breakdown Analytics'}
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded font-mono border border-blue-200/50">
                {viewTab === 'all' ? t.chartAllDays : viewTab === 'w1' ? t.week1 : t.week2}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Desktop Legend Indicators */}
              <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-600 mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
                  <span>{t.chartWorkedHours}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" />
                  <span>{t.chartStandardTarget}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0 border-t-2 border-dashed border-amber-500 inline-block" />
                  <span className="text-amber-700 font-medium">8.0h Baseline</span>
                </div>
              </div>

              {/* Segmented Filter Control: All 14 Days / Week 1 / Week 2 */}
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewTab('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.chartAllDays}
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('w1')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewTab === 'w1'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.week1}
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('w2')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewTab === 'w2'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.week2}
                </button>
              </div>
            </div>
          </div>

          {/* Quick KPI Strip under chart header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 my-1 border-b border-slate-100 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Target Workdays</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {targetWorkdaysInView.length} {language === 'fr' ? 'jours' : 'days'} ({viewTargetTotal.toFixed(1)}h)
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">8h Target Met</span>
              <span className="font-mono font-bold text-emerald-600 tabular-nums">
                {metTargetCount} / {targetWorkdaysInView.length} {language === 'fr' ? 'jours' : 'days'}
                {targetWorkdaysInView.length > 0 && (
                  <span className="text-[10px] text-emerald-700 ml-1 font-sans">
                    ({Math.round((metTargetCount / targetWorkdaysInView.length) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Hours Logged</span>
              <span className={`font-mono font-bold tabular-nums ${
                viewWorkedTotal === 0 ? 'text-slate-400' : 'text-blue-600'
              }`}>
                {viewWorkedTotal.toFixed(2)}h
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Period Daily Avg</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {targetWorkdaysInView.length > 0 ? (viewWorkedTotal / targetWorkdaysInView.length).toFixed(2) : '0.00'}h/day
              </span>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="w-full h-64 sm:h-72 mt-2 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedChartData}
                margin={{ top: 18, right: 12, left: -20, bottom: 4 }}
                barGap={3}
                barCategoryGap={viewTab === 'all' ? '18%' : '28%'}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                  stroke="#E2E8F0"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  stroke="#E2E8F0"
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 1))]}
                  unit="h"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', opacity: 0.9 }} />
                <ReferenceLine
                  y={standardDailyTarget}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `${standardDailyTarget.toFixed(1)}h Target`,
                    position: 'insideTopRight',
                    fill: '#D97706',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                {/* Target 8h Bar */}
                <Bar
                  dataKey="targetHours"
                  name={t.chartStandardTarget}
                  fill="#E2E8F0"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={viewTab === 'all' ? 24 : 40}
                />
                {/* Actual Worked Hours Bar */}
                <Bar
                  dataKey="workedHours"
                  name={t.chartWorkedHours}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={viewTab === 'all' ? 24 : 40}
                >
                  {displayedChartData.map((entry, index) => {
                    let barColor = '#2563EB'; // standard blue
                    if (entry.isScheduledDayOff) {
                      barColor = '#F59E0B'; // amber for scheduled day off
                    } else if (entry.isDidNotWork) {
                      barColor = '#E11D48'; // rose for didn't work
                    } else if (entry.isWeekend) {
                      barColor = entry.workedHours > 0 ? '#6366F1' : '#CBD5E1';
                    } else if (entry.workedHours > standardDailyTarget) {
                      barColor = '#0284C7'; // sky/cyan for overtime day (>8h)
                    } else if (entry.workedHours === standardDailyTarget) {
                      barColor = '#059669'; // emerald for exactly 8.0h met
                    } else if (entry.workedHours > 0) {
                      barColor = '#3B82F6'; // blue for regular work
                    } else {
                      barColor = '#CBD5E1'; // muted empty
                    }
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mobile Legend Footer */}
          <div className="flex lg:hidden items-center justify-between gap-2 text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              <span>{t.chartWorkedHours}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 inline-block" />
              <span>{t.chartStandardTarget}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0 border-t-2 border-dashed border-amber-500 inline-block" />
              <span className="text-amber-700 font-medium">8.0h Baseline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
