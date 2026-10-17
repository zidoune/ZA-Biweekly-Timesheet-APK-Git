import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  Coffee,
  BarChart3,
  Calendar,
  CalendarRange,
  Scale,
  TrendingUp,
  Info,
} from 'lucide-react';
import { DayOff, DaySchedule, Project, TimeEntry, TimesheetProfile } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';
import { getBiweeklyDays } from '../utils/dateUtils';

interface PeriodSummaryCardsProps {
  entries: TimeEntry[];
  projects: Project[];
  profile: TimesheetProfile;
  daysOff?: DayOff[];
  periodDateSet?: Set<string>;
  periodDays?: DaySchedule[];
  activeChartTab?: 'all' | 'w1' | 'w2';
  onViewWeekChart?: (tab: 'w1' | 'w2') => void;
}

export const PeriodSummaryCards: React.FC<PeriodSummaryCardsProps> = ({
  entries,
  projects,
  profile,
  daysOff = [],
  periodDateSet,
  periodDays: propPeriodDays,
  activeChartTab,
  onViewWeekChart,
}) => {
  const { t, language } = useLanguage();
  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));

  // Count days off inside current period
  const periodDaysOff = daysOff.filter(
    (d) => !periodDateSet || periodDateSet.has(d.date)
  );
  const periodDaysOffCount = periodDaysOff.length;

  // Any day marked as Day Off, Leave, or Didn't Work is an unworked day (0 worked hours)
  const unworkedDaySet = new Set(periodDaysOff.map((d) => d.date));

  const getEffectiveNetHours = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    return e.netHours;
  };

  // Map total effective worked hours per date to determine if a day has 0.00 hours of work
  const dailyWorkedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const eff = getEffectiveNetHours(e);
      map.set(e.date, (map.get(e.date) || 0) + eff);
    });
    return map;
  }, [entries, unworkedDaySet]);

  // Do not count meal breaks when there is 0.00 hours of work in that day
  const getEffectiveBreakMinutes = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    const dayWorked = dailyWorkedHoursMap.get(e.date) || 0;
    if (dayWorked <= 0) return 0;
    return e.breakMinutes || 0;
  };

  const totalNetHours = entries.reduce((acc, curr) => acc + getEffectiveNetHours(curr), 0);
  const totalBreakMinutes = entries.reduce((acc, curr) => acc + getEffectiveBreakMinutes(curr), 0);

  // Adjusted target workdays (standard 10 minus days marked as off)
  const effectiveTargetDays = Math.max(0, profile.targetWorkingDays - periodDaysOffCount);
  const targetHours = effectiveTargetDays * profile.dailyStandardHours;

  // Overtime threshold setting: defines hours (e.g. 80 hrs/period) that trigger overtime pay calculations
  const otThreshold = profile.overtimeThreshold != null && profile.overtimeThreshold > 0
    ? profile.overtimeThreshold
    : targetHours;
  const regularHours = Math.min(totalNetHours, otThreshold);
  const overtimeHours = Math.max(0, totalNetHours - otThreshold);
  const otMultiplier = profile.overtimeRateMultiplier || 1.5;
  const baseHourlyRate = profile.defaultHourlyRate != null ? profile.defaultHourlyRate : 30;

  let billableHours = 0;
  let totalBillableAmount = 0;

  entries.forEach((e) => {
    const proj = projectMap.get(e.projectId);
    const eff = getEffectiveNetHours(e);
    if (proj && proj.billable) {
      billableHours += eff;
      totalBillableAmount += eff * (proj.rate || 0);
    }
  });

  // Gross Pay: strictly Total Net Hours multiplied by Base Hourly Rate
  const grossPay = totalNetHours * baseHourlyRate;
  const totalPayment = grossPay;
  // Estimated net pay applies the requested flat 18.8% deduction to gross pay.
  const estimatedNetPay = grossPay * (1 - 0.188);

  const progressPercent = targetHours > 0
    ? Math.min(100, Math.round((totalNetHours / targetHours) * 100))
    : 100;

  const hrsLabel = language === 'fr' ? 'h' : 'hrs';
  const minLabel = language === 'fr' ? 'min' : 'min';

  const standardDailyTarget = profile.dailyStandardHours || 8.0;

  // 80-Hour Biweekly Threshold Breakdown (Standard biweekly period threshold)
  const biweekly80Threshold = 80.0;
  const regularHours80 = Math.min(totalNetHours, biweekly80Threshold);
  const potentialOtHours80 = Math.max(0, totalNetHours - biweekly80Threshold);
  const remainingHoursTo80 = Math.max(0, biweekly80Threshold - totalNetHours);
  const percentOf80 = Math.min(100, Math.round((totalNetHours / biweekly80Threshold) * 100));

  const [hoursTooltipOpen, setHoursTooltipOpen] = useState(false);
  const hoursTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (hoursTooltipRef.current && !hoursTooltipRef.current.contains(event.target as Node)) {
        setHoursTooltipOpen(false);
      }
    };

    if (hoursTooltipOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [hoursTooltipOpen]);

  const periodDays = useMemo(() => {
    if (propPeriodDays && propPeriodDays.length > 0) return propPeriodDays;
    if (periodDateSet && periodDateSet.size > 0) {
      const sorted = Array.from(periodDateSet).sort();
      return getBiweeklyDays(sorted[0], language === 'fr' ? 'fr-CA' : 'en-CA');
    }
    return getBiweeklyDays('2026-10-05', language === 'fr' ? 'fr-CA' : 'en-CA');
  }, [propPeriodDays, periodDateSet, language]);

  // First Week (Week 1) and Second Week (Week 2) Calculations for Payroll Reconciliation
  const weeklyBreakdown = useMemo(() => {
    const week1Days = periodDays.filter((d) => d.weekNumber === 1);
    const week2Days = periodDays.filter((d) => d.weekNumber === 2);

    const week1DateSet = new Set(week1Days.map((d) => d.date));
    const week2DateSet = new Set(week2Days.map((d) => d.date));

    const week1Entries = entries.filter((e) => week1DateSet.has(e.date));
    const week2Entries = entries.filter((e) => week2DateSet.has(e.date));

    const week1WorkedHours = week1Entries.reduce((sum, e) => sum + getEffectiveNetHours(e), 0);
    const week2WorkedHours = week2Entries.reduce((sum, e) => sum + getEffectiveNetHours(e), 0);

    const week1BreakMinutes = week1Entries.reduce((sum, e) => sum + getEffectiveBreakMinutes(e), 0);
    const week2BreakMinutes = week2Entries.reduce((sum, e) => sum + getEffectiveBreakMinutes(e), 0);

    const week1DaysOff = periodDaysOff.filter((d) => week1DateSet.has(d.date));
    const week2DaysOff = periodDaysOff.filter((d) => week2DateSet.has(d.date));

    // Target workdays in each week (Mon-Fri workdays not designated as off/didn't work)
    const week1TargetDays = week1Days.filter((d) => d.isWorkday && !unworkedDaySet.has(d.date)).length;
    const week2TargetDays = week2Days.filter((d) => d.isWorkday && !unworkedDaySet.has(d.date)).length;

    const week1TargetHours = week1TargetDays * standardDailyTarget;
    const week2TargetHours = week2TargetDays * standardDailyTarget;

    // Standard 40.0h weekly overtime threshold
    const standardWeeklyCap = 40.0;
    const week1RegularHours = Math.min(week1WorkedHours, standardWeeklyCap);
    const week1OtHours = Math.max(0, week1WorkedHours - standardWeeklyCap);

    const week2RegularHours = Math.min(week2WorkedHours, standardWeeklyCap);
    const week2OtHours = Math.max(0, week2WorkedHours - standardWeeklyCap);

    const week1GrossPay = week1WorkedHours * baseHourlyRate;
    const week2GrossPay = week2WorkedHours * baseHourlyRate;

    const week1DaysWorkedCount = new Set(
      week1Entries.filter((e) => getEffectiveNetHours(e) > 0).map((e) => e.date)
    ).size;
    const week2DaysWorkedCount = new Set(
      week2Entries.filter((e) => getEffectiveNetHours(e) > 0).map((e) => e.date)
    ).size;

    const week1DateRangeLabel = week1Days.length > 0
      ? `${week1Days[0].formattedDate} – ${week1Days[week1Days.length - 1].formattedDate}`
      : 'Days 1–7';
    const week2DateRangeLabel = week2Days.length > 0
      ? `${week2Days[0].formattedDate} – ${week2Days[week2Days.length - 1].formattedDate}`
      : 'Days 8–14';

    const week1Progress = week1TargetHours > 0
      ? Math.min(100, Math.round((week1WorkedHours / week1TargetHours) * 100))
      : 100;
    const week2Progress = week2TargetHours > 0
      ? Math.min(100, Math.round((week2WorkedHours / week2TargetHours) * 100))
      : 100;

    return {
      week1: {
        days: week1Days,
        dateRangeLabel: week1DateRangeLabel,
        workedHours: week1WorkedHours,
        breakMinutes: week1BreakMinutes,
        daysOffCount: week1DaysOff.length,
        targetDays: week1TargetDays,
        targetHours: week1TargetHours,
        regularHours: week1RegularHours,
        otHours: week1OtHours,
        grossPay: week1GrossPay,
        daysWorkedCount: week1DaysWorkedCount,
        progressPercent: week1Progress,
        variance: week1WorkedHours - week1TargetHours,
      },
      week2: {
        days: week2Days,
        dateRangeLabel: week2DateRangeLabel,
        workedHours: week2WorkedHours,
        breakMinutes: week2BreakMinutes,
        daysOffCount: week2DaysOff.length,
        targetDays: week2TargetDays,
        targetHours: week2TargetHours,
        regularHours: week2RegularHours,
        otHours: week2OtHours,
        grossPay: week2GrossPay,
        daysWorkedCount: week2DaysWorkedCount,
        progressPercent: week2Progress,
        variance: week2WorkedHours - week2TargetHours,
      },
      isReconciled: Math.abs((week1WorkedHours + week2WorkedHours) - totalNetHours) < 0.001,
      totalHours: week1WorkedHours + week2WorkedHours,
      totalGrossPay: week1GrossPay + week2GrossPay,
    };
  }, [periodDays, entries, periodDaysOff, unworkedDaySet, standardDailyTarget, baseHourlyRate, totalNetHours]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Compact mobile snapshot: week-by-week hours and pay-period total */}
      <div className="grid grid-cols-3 gap-2 sm:hidden" aria-label={language === 'fr' ? 'Résumé des heures' : 'Hours summary'}>
        <div className="min-w-0 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-blue-800">{language === 'fr' ? 'Semaine 1' : 'Week 1'}</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{weeklyBreakdown.week1.workedHours.toFixed(1)}<span className="ml-1 text-xs font-semibold">h</span></div>
        </div>
        <div className="min-w-0 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">{language === 'fr' ? 'Semaine 2' : 'Week 2'}</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{weeklyBreakdown.week2.workedHours.toFixed(1)}<span className="ml-1 text-xs font-semibold">h</span></div>
        </div>
        <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{language === 'fr' ? '14 jours' : 'Biweekly'}</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{weeklyBreakdown.totalHours.toFixed(1)}<span className="ml-1 text-xs font-semibold">h</span></div>
        </div>
      </div>
      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Period Hours & Target */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between relative group/card">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">
                {language === 'fr' ? 'Heures totales' : 'Total Hours'}
              </span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            </div>

            {/* Total Hours Interactive Display with Hover & Tap Tooltip */}
            <div
              ref={hoursTooltipRef}
              className="relative inline-block group/hours"
              onMouseEnter={() => setHoursTooltipOpen(true)}
              onMouseLeave={() => setHoursTooltipOpen(false)}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoursTooltipOpen((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHoursTooltipOpen((prev) => !prev);
                  }
                }}
                className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 rounded-md -m-0.5 p-0.5"
                title={`${language === 'fr' ? 'Cliquer ou survoler pour la répartition sur 80h' : 'Click or hover for 80-hour threshold breakdown'}`}
              >
                <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums border-b-2 border-dashed border-slate-300 group-hover/hours:border-blue-500 transition-colors ${
                  totalNetHours === 0 ? 'text-slate-400 group-hover/hours:text-slate-500' : 'text-slate-900 group-hover/hours:text-blue-600'
                }`}>
                  {totalNetHours.toFixed(2)}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  / {targetHours.toFixed(1)} {hrsLabel}
                </span>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-blue-600 group-hover/hours:bg-blue-600 group-hover/hours:text-white transition-all ml-0.5">
                  <Info className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Tooltip on hover / toggle */}
              <div
                className={`absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all duration-200 select-none ${
                  hoursTooltipOpen
                    ? 'opacity-100 scale-100 pointer-events-auto visible'
                    : 'opacity-0 scale-95 pointer-events-none invisible group-hover/hours:opacity-100 group-hover/hours:scale-100 group-hover/hours:pointer-events-auto group-hover/hours:visible'
                }`}
                style={{ filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Arrow indicator */}
                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-700/80" />

                {/* Tooltip Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-bold text-xs text-white">
                      {t.hoursBreakdownTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    80h Threshold
                  </span>
                </div>

                {/* Total Logged Summary */}
                <div className="flex items-baseline justify-between py-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-300 font-sans">
                    {language === 'fr' ? 'Total travaillé :' : 'Total Hours Logged:'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-base font-bold text-white tabular-nums">
                      {totalNetHours.toFixed(2)}h
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      / 80.00h
                    </span>
                  </div>
                </div>

                {/* Visual Dual-color Progress Split Bar */}
                <div className="py-2.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-mono">
                    <span className="font-sans">{language === 'fr' ? 'Progression seuil 80h' : '80h Threshold Progress'}</span>
                    <span className={`font-semibold ${totalNetHours >= 80 ? 'text-amber-300' : 'text-blue-300'}`}>
                      {totalNetHours >= 80
                        ? `100% (+${potentialOtHours80.toFixed(2)}h OT)`
                        : `${percentOf80}% of 80h`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalNetHours >= 80 ? 'bg-blue-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, (regularHours80 / biweekly80Threshold) * 100)}%` }}
                    />
                    {potentialOtHours80 > 0 && (
                      <div
                        className="bg-amber-400 h-full transition-all duration-300 animate-pulse"
                        style={{
                          width: `${Math.min(
                            100,
                            (potentialOtHours80 / (totalNetHours || 1)) * 100
                          )}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Breakdown Details */}
                <div className="space-y-1.5 text-xs font-mono">
                  {/* Regular Hours Row */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="font-sans text-[11px] text-slate-200 font-semibold">
                          {t.regularHours80Label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-sans">
                          {language === 'fr' ? 'Base taux régulier (plafond 80h)' : 'Base regular rate (up to 80h)'}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-white tabular-nums text-xs">
                      {regularHours80.toFixed(2)}h
                    </span>
                  </div>

                  {/* Potential Overtime Row */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    potentialOtHours80 > 0
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        potentialOtHours80 > 0 ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-600'
                      }`} />
                      <div className="flex flex-col text-left">
                        <span className={`font-sans text-[11px] font-semibold ${
                          potentialOtHours80 > 0 ? 'text-amber-200' : 'text-slate-300'
                        }`}>
                          {t.potentialOt80Label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-sans">
                          {potentialOtHours80 > 0
                            ? (language === 'fr' ? 'Admissible au taux supplémentaire' : 'Eligible for OT multiplier')
                            : (language === 'fr' ? 'Aucune heure supplémentaire' : 'No overtime hours logged')}
                        </span>
                      </div>
                    </div>
                    <span className={`font-bold tabular-nums text-xs ${
                      potentialOtHours80 > 0 ? 'text-amber-300' : 'text-slate-400'
                    }`}>
                      {potentialOtHours80 > 0 ? `+${potentialOtHours80.toFixed(2)}h` : '0.00h'}
                    </span>
                  </div>
                </div>

                {/* First Week & Second Week Split for Payroll in Tooltip */}
                <div className="pt-2 pb-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans mb-1.5">
                    <span>{t.weeklyReconciliation}:</span>
                    <span className="text-emerald-400 font-semibold">100% {language === 'fr' ? 'Rapproché' : 'Reconciled'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/70">
                      <div className="flex justify-between items-center text-[10px] text-slate-300 font-sans mb-0.5">
                        <span className="font-semibold text-blue-300">{t.firstWeek}</span>
                        <span className="text-[9px] text-slate-400">{weeklyBreakdown.week1.dateRangeLabel}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-white tabular-nums text-sm">{weeklyBreakdown.week1.workedHours.toFixed(2)}h</span>
                        <span className="text-[10px] text-slate-400">/ {weeklyBreakdown.week1.targetHours.toFixed(1)}h</span>
                      </div>
                      {weeklyBreakdown.week1.otHours > 0 && (
                        <span className="text-[9px] text-amber-300 font-sans block mt-0.5">+{weeklyBreakdown.week1.otHours.toFixed(2)}h OT</span>
                      )}
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/70">
                      <div className="flex justify-between items-center text-[10px] text-slate-300 font-sans mb-0.5">
                        <span className="font-semibold text-indigo-300">{t.secondWeek}</span>
                        <span className="text-[9px] text-slate-400">{weeklyBreakdown.week2.dateRangeLabel}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-white tabular-nums text-sm">{weeklyBreakdown.week2.workedHours.toFixed(2)}h</span>
                        <span className="text-[10px] text-slate-400">/ {weeklyBreakdown.week2.targetHours.toFixed(1)}h</span>
                      </div>
                      {weeklyBreakdown.week2.otHours > 0 && (
                        <span className="text-[9px] text-amber-300 font-sans block mt-0.5">+{weeklyBreakdown.week2.otHours.toFixed(2)}h OT</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overtime Status Badge / Informational Callout */}
                <div className="mt-2.5 pt-2 border-t border-slate-800">
                  {potentialOtHours80 > 0 ? (
                    <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-sans">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>{t.otTriggeredNotice}</strong>{' '}
                        {language === 'fr'
                          ? `Majoration (${profile.overtimeRateMultiplier || 1.5}x) sur ${potentialOtHours80.toFixed(2)}h.`
                          : `Eligible for ${profile.overtimeRateMultiplier || 1.5}x pay on ${potentialOtHours80.toFixed(2)}h.`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                      <span>{t.remainingTo80hLabel}:</span>
                      <span className="font-mono font-bold text-blue-300 tabular-nums">
                        {remainingHoursTo80.toFixed(2)}h
                      </span>
                    </div>
                  )}

                  <p className="text-[9px] text-slate-400 mt-2 font-sans leading-tight">
                    {t.standardBiweeklyCapNotice}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium">
              <span>{progressPercent}%</span>
              <span>
                {effectiveTargetDays} {language === 'fr' ? 'Jours' : 'Days'}
                {periodDaysOffCount > 0
                  ? (language === 'fr' ? ` · ${periodDaysOffCount} off` : ` · ${periodDaysOffCount} off`)
                  : ''}
              </span>
            </div>

            {/* Quick First Week & Second Week hours reconciliation badge in Card 1 */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 mt-2 pt-1.5 border-t border-slate-100 font-mono">
              <span className="flex items-center gap-1" title={`${t.firstWeek}: ${weeklyBreakdown.week1.workedHours.toFixed(2)}h`}>
                <span className="font-semibold text-blue-700">W1:</span>{' '}
                <span className={weeklyBreakdown.week1.workedHours === 0 ? 'text-slate-400' : ''}>
                  {weeklyBreakdown.week1.workedHours.toFixed(2)}h
                </span>
              </span>
              <span className="text-slate-300">/</span>
              <span className="flex items-center gap-1" title={`${t.secondWeek}: ${weeklyBreakdown.week2.workedHours.toFixed(2)}h`}>
                <span className="font-semibold text-indigo-700">W2:</span>{' '}
                <span className={weeklyBreakdown.week2.workedHours === 0 ? 'text-slate-400' : ''}>
                  {weeklyBreakdown.week2.workedHours.toFixed(2)}h
                </span>
              </span>
              <span className="text-emerald-700 font-semibold text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/70 shrink-0">
                ✓ {language === 'fr' ? 'Rapproché' : 'Reconciled'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Gross Pay in vibrant color theme */}
        <div className="bg-gradient-to-b from-emerald-50/60 via-white to-white border border-emerald-200/90 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1 gap-1.5">
              <span
                className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider leading-snug truncate flex items-center gap-1"
                title={t.totalPaymentTitle}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{language === 'fr' ? 'Paiement brut :' : 'Gross Pay:'}</span>
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
                {profile.currencySymbol || '$'}
                {totalPayment.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200/70 px-1.5 py-0.5 rounded">
                {language === 'fr' ? 'brut' : 'gross'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-emerald-100 space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs bg-emerald-50/50 p-1 rounded-md border border-emerald-100/70">
              <span className="font-mono text-emerald-900 font-medium pl-1">{totalNetHours.toFixed(2)}h × {profile.currencySymbol || '$'}{baseHourlyRate}/hr</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums bg-white px-1.5 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
                = {profile.currencySymbol || '$'}{grossPay.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Net Pay: Gross Pay less the fixed 18.8% deduction */}
        <div className="bg-gradient-to-b from-cyan-50/70 via-white to-white border border-cyan-200/90 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1 gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-cyan-800 uppercase tracking-wider leading-snug">
                ESTIMATE NET PAY
              </span>
              <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-200/60 shadow-2xs">
                <DollarSign className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-black text-cyan-700 tabular-nums">
                {profile.currencySymbol || '$'}
                {estimatedNetPay.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-cyan-100 space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs bg-cyan-50/60 p-1 rounded-md border border-cyan-100/70">
              <span className="font-mono text-cyan-900 font-medium pl-1">
                {language === 'fr' ? 'Déduction estimée' : 'Estimated deduction'} (18.8%)
              </span>
              <span className="font-mono font-bold text-cyan-800 tabular-nums bg-white px-1.5 py-0.5 rounded border border-cyan-200/60 shadow-2xs">
                −{(grossPay * 0.188).toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Unpaid Break Deductions (Meal Breaks in hours and Min) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">
                {language === 'fr' ? 'Pauses repas' : 'Meal Breaks'}
              </span>
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {Math.floor(totalBreakMinutes / 60)}h {Math.round(totalBreakMinutes % 60)}m
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {language === 'fr' ? 'déduit' : 'deducted'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
            <span>{language === 'fr' ? 'Non payé :' : 'Unpaid:'}</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">
              {Math.floor(totalBreakMinutes / 60)}h {Math.round(totalBreakMinutes % 60)}m
            </span>
          </div>
        </div>

        {/* Card 4: Workdays & Daily Average */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">
                {language === 'fr' ? 'Jours ouvrés' : 'Workdays'}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {new Set(entries.map((e) => e.date)).size}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                / {effectiveTargetDays} {language === 'fr' ? 'cible' : 'target'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
            <span>{language === 'fr' ? 'Moyenne :' : 'Average:'}</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">
              {new Set(entries.map((e) => e.date)).size > 0
                ? (totalNetHours / new Set(entries.map((e) => e.date)).size).toFixed(1)
                : '0.0'}{' '}
              {language === 'fr' ? 'h/j' : 'h/day'}
            </span>
          </div>
        </div>
      </div>

      {/* Biweekly Payroll Reconciliation: First Week & Second Week Breakdown Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4.5 shadow-xs">
        {/* Header Strip with Title, Subtitle, and Biweekly Reconciliation Equation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/50">
                <CalendarRange className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {t.weeklyReconciliation}
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60 font-mono">
                  {language === 'fr' ? 'Paie bimensuelle' : 'Biweekly Payroll'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 pl-9">
              {t.weeklyBreakdownSubtitle}
            </p>
          </div>

          {/* Quick Mathematical Equation Pill */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono shrink-0">
            <span className="font-semibold text-blue-700">W1: {weeklyBreakdown.week1.workedHours.toFixed(2)}h</span>
            <span className="text-slate-400">+</span>
            <span className="font-semibold text-indigo-700">W2: {weeklyBreakdown.week2.workedHours.toFixed(2)}h</span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-slate-900">{totalNetHours.toFixed(2)}h</span>
            <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold ml-1 border border-emerald-200">
              ✓ {language === 'fr' ? 'Équilibré' : 'Balanced'}
            </span>
          </div>
        </div>

        {/* 2 Comparison Cards: First Week and Second Week */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
          {/* Card: First Week */}
          <div
            className={`rounded-xl border p-3.5 sm:p-4 transition-all ${
              activeChartTab === 'w1'
                ? 'border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-500/20'
                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
            }`}
          >
            {/* Week 1 Card Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                  {t.week1}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {t.firstWeek}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {weeklyBreakdown.week1.dateRangeLabel}
              </span>
            </div>

            {/* Week 1 Hero Hours & Target */}
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  {language === 'fr' ? 'Heures travaillées' : 'Hours Worked'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${
                    weeklyBreakdown.week1.workedHours === 0 ? 'text-slate-400' : 'text-slate-900'
                  }`}>
                    {weeklyBreakdown.week1.workedHours.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {weeklyBreakdown.week1.targetHours.toFixed(1)} {hrsLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  {t.weeklyGrossPay}
                </span>
                <span className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {profile.currencySymbol || '$'}
                  {weeklyBreakdown.week1.grossPay.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Week 1 Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    weeklyBreakdown.week1.workedHours >= weeklyBreakdown.week1.targetHours && weeklyBreakdown.week1.targetHours > 0
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${weeklyBreakdown.week1.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>{weeklyBreakdown.week1.progressPercent}% {language === 'fr' ? 'cible' : 'target'}</span>
                <span>
                  {weeklyBreakdown.week1.variance >= 0 ? `+${weeklyBreakdown.week1.variance.toFixed(2)}h` : `${weeklyBreakdown.week1.variance.toFixed(2)}h`} {t.weeklyVariance.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Week 1 Granular Reconciliation Metrics Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Regular (≤40h)</span>
                <span className={`font-mono font-bold tabular-nums text-xs mt-0.5 ${
                  weeklyBreakdown.week1.regularHours === 0 ? 'text-slate-400' : 'text-slate-800'
                }`}>
                  {weeklyBreakdown.week1.regularHours.toFixed(2)}h
                </span>
              </div>
              <div className={`p-2 rounded-lg border flex flex-col ${
                weeklyBreakdown.week1.otHours > 0
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-white border-slate-200/80 text-slate-800'
              }`}>
                <span className="text-[9px] uppercase font-semibold text-slate-400">Overtime (&gt;40h)</span>
                <span className={`font-mono font-bold tabular-nums text-xs mt-0.5 ${
                  weeklyBreakdown.week1.otHours > 0 ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {weeklyBreakdown.week1.otHours > 0 ? `+${weeklyBreakdown.week1.otHours.toFixed(2)}h` : '0.00h'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Meal Breaks</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums text-xs mt-0.5">
                  {Math.floor(weeklyBreakdown.week1.breakMinutes / 60)}h {Math.round(weeklyBreakdown.week1.breakMinutes % 60)}m
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Workdays</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums text-xs mt-0.5">
                  {weeklyBreakdown.week1.daysWorkedCount} / {weeklyBreakdown.week1.targetDays} {language === 'fr' ? 'j' : 'days'}
                </span>
              </div>
            </div>

            {/* Week 1 Filter Chart Action */}
            <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 text-[10px] font-mono">
                {weeklyBreakdown.week1.workedHours.toFixed(2)}h × {profile.currencySymbol || '$'}{baseHourlyRate}/hr
              </span>
              <button
                type="button"
                onClick={() => onViewWeekChart?.('w1')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
              >
                {language === 'fr' ? 'Voir sur le graphique' : 'View on Chart'}
              </button>
            </div>
          </div>

          {/* Card: Second Week */}
          <div
            className={`rounded-xl border p-3.5 sm:p-4 transition-all ${
              activeChartTab === 'w2'
                ? 'border-indigo-500 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
            }`}
          >
            {/* Week 2 Card Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                  {t.week2}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {t.secondWeek}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {weeklyBreakdown.week2.dateRangeLabel}
              </span>
            </div>

            {/* Week 2 Hero Hours & Target */}
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  {language === 'fr' ? 'Heures travaillées' : 'Hours Worked'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${
                    weeklyBreakdown.week2.workedHours === 0 ? 'text-slate-400' : 'text-slate-900'
                  }`}>
                    {weeklyBreakdown.week2.workedHours.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {weeklyBreakdown.week2.targetHours.toFixed(1)} {hrsLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  {t.weeklyGrossPay}
                </span>
                <span className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {profile.currencySymbol || '$'}
                  {weeklyBreakdown.week2.grossPay.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Week 2 Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    weeklyBreakdown.week2.workedHours >= weeklyBreakdown.week2.targetHours && weeklyBreakdown.week2.targetHours > 0
                      ? 'bg-emerald-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${weeklyBreakdown.week2.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>{weeklyBreakdown.week2.progressPercent}% {language === 'fr' ? 'cible' : 'target'}</span>
                <span>
                  {weeklyBreakdown.week2.variance >= 0 ? `+${weeklyBreakdown.week2.variance.toFixed(2)}h` : `${weeklyBreakdown.week2.variance.toFixed(2)}h`} {t.weeklyVariance.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Week 2 Granular Reconciliation Metrics Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Regular (≤40h)</span>
                <span className={`font-mono font-bold tabular-nums text-xs mt-0.5 ${
                  weeklyBreakdown.week2.regularHours === 0 ? 'text-slate-400' : 'text-slate-800'
                }`}>
                  {weeklyBreakdown.week2.regularHours.toFixed(2)}h
                </span>
              </div>
              <div className={`p-2 rounded-lg border flex flex-col ${
                weeklyBreakdown.week2.otHours > 0
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-white border-slate-200/80 text-slate-800'
              }`}>
                <span className="text-[9px] uppercase font-semibold text-slate-400">Overtime (&gt;40h)</span>
                <span className={`font-mono font-bold tabular-nums text-xs mt-0.5 ${
                  weeklyBreakdown.week2.otHours > 0 ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {weeklyBreakdown.week2.otHours > 0 ? `+${weeklyBreakdown.week2.otHours.toFixed(2)}h` : '0.00h'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Meal Breaks</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums text-xs mt-0.5">
                  {Math.floor(weeklyBreakdown.week2.breakMinutes / 60)}h {Math.round(weeklyBreakdown.week2.breakMinutes % 60)}m
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex flex-col">
                <span className="text-[9px] uppercase font-semibold text-slate-400">Workdays</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums text-xs mt-0.5">
                  {weeklyBreakdown.week2.daysWorkedCount} / {weeklyBreakdown.week2.targetDays} {language === 'fr' ? 'j' : 'days'}
                </span>
              </div>
            </div>

            {/* Week 2 Filter Chart Action */}
            <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 text-[10px] font-mono">
                {weeklyBreakdown.week2.workedHours.toFixed(2)}h × {profile.currencySymbol || '$'}{baseHourlyRate}/hr
              </span>
              <button
                type="button"
                onClick={() => onViewWeekChart?.('w2')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
              >
                {language === 'fr' ? 'Voir sur le graphique' : 'View on Chart'}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Reconciliation Summary Bar at Bottom */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-800">
              {t.reconciliationSummary}:
            </span>
            <span className="text-slate-600 font-mono">
              {weeklyBreakdown.week1.workedHours.toFixed(2)}h ({t.firstWeek}) + {weeklyBreakdown.week2.workedHours.toFixed(2)}h ({t.secondWeek}) = <strong className="text-slate-900">{totalNetHours.toFixed(2)}h</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-700 font-bold">
              {profile.currencySymbol || '$'}{weeklyBreakdown.week1.grossPay.toFixed(2)} + {profile.currencySymbol || '$'}{weeklyBreakdown.week2.grossPay.toFixed(2)} = {profile.currencySymbol || '$'}{grossPay.toFixed(2)}
            </span>
            <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200/80">
              100% {language === 'fr' ? 'Rapproché' : 'Reconciled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
