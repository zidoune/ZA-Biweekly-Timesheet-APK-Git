import React, { useState } from 'react';
import { DayOff, DaySchedule, Project, TimeEntry } from '../types/timesheet';
import { formatTime12h, toISODateString } from '../utils/dateUtils';
import { Palmtree, Plus, Clock, Coffee, Trash2, Edit3, Calendar, RotateCcw, Ban } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TimesheetGridProps {
  days: DaySchedule[];
  entries: TimeEntry[];
  projects: Project[];
  daysOff?: DayOff[];
  onOpenAddModal: (targetDateISO?: string) => void;
  onOpenEditModal: (entry: TimeEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onOpenDayOffModal: (targetDateISO: string, initialMode?: 'day_off' | 'did_not_work') => void;
  onRemoveDayOff: (targetDateISO: string) => void;
}

export const TimesheetGrid: React.FC<TimesheetGridProps> = ({
  days,
  entries,
  projects,
  daysOff = [],
  onOpenAddModal,
  onOpenEditModal,
  onDeleteEntry,
  onOpenDayOffModal,
  onRemoveDayOff,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'w1' | 'w2'>('all');

  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));

  const todayISO = toISODateString(new Date());

  const week1Days = days.filter((d) => d.weekNumber === 1);
  const week2Days = days.filter((d) => d.weekNumber === 2);

  const displayedDays =
    activeTab === 'w1' ? week1Days : activeTab === 'w2' ? week2Days : days;

  // Calculate week subtotals: unworked days (day off or didn't work) have 0 worked hours
  const getEntryEffectiveHours = (e: TimeEntry) => {
    const dayOff = dayOffMap.get(e.date);
    if (dayOff) {
      return 0;
    }
    return e.netHours;
  };

  const week1Total = entries
    .filter((e) => week1Days.some((d) => d.date === e.date))
    .reduce((acc, e) => acc + getEntryEffectiveHours(e), 0);

  const week2Total = entries
    .filter((e) => week2Days.some((d) => d.date === e.date))
    .reduce((acc, e) => acc + getEntryEffectiveHours(e), 0);

  // Workday counting index excluding days marked as Day Off
  let workdayCounter = 0;
  const workdayIndexMap = new Map<string, number>();
  days.forEach((d) => {
    if (d.isWorkday && !dayOffMap.has(d.date)) {
      workdayCounter += 1;
      workdayIndexMap.set(d.date, workdayCounter);
    }
  });
  const totalActiveWorkdays = workdayCounter;

  return (
    <div className="space-y-4">
      {/* View Segmented Tabs & Week Subtotals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial min-h-[44px] px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap text-center ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">{language === 'fr' ? '14 Jours' : '14 Days'}</span>
            <span className="hidden sm:inline">{language === 'fr' ? 'Tous les 14 jours (Cycle complet)' : 'All 14 Days (Full Cycle)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('w1')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap text-center ${
              activeTab === 'w1'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.week1} ({week1Total.toFixed(1)} {language === 'fr' ? 'h' : 'hrs'})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('w2')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap text-center ${
              activeTab === 'w2'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.week2} ({week2Total.toFixed(1)} {language === 'fr' ? 'h' : 'hrs'})
          </button>
        </div>

        {/* Global Add Entry Button */}
        <button
          type="button"
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors w-full sm:w-auto min-h-[48px] shrink-0 active:scale-[0.99]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'fr' ? '+ Saisir des heures' : '+ Log Manual Punch'}</span>
        </button>
      </div>

      {/* Days Schedule List */}
      <div className="space-y-3">
        {displayedDays.map((day) => {
          const dayEntries = entries
            .filter((e) => e.date === day.date)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const rawDayTotalNet = dayEntries.reduce((acc, curr) => acc + curr.netHours, 0);
          const workdayNum = workdayIndexMap.get(day.date);
          const dayOff = dayOffMap.get(day.date);
          const isDayOff = Boolean(dayOff);
          const isDidNotWork = Boolean(dayOff?.isDidNotWork || dayOff?.reason === "Didn't work");
          const isScheduledDayOff = Boolean(dayOff && !isDidNotWork);

          // If day marked as Day Off or Didn't Work (unworked), worked hours for that day is 0 hrs
          const dayTotalNet = isDayOff ? 0 : rawDayTotalNet;

          return (
            <div
              key={day.date}
              className={`border rounded-xl transition-colors ${
                isDayOff
                  ? isDidNotWork
                    ? 'bg-rose-50/20 border-rose-200/80 shadow-2xs'
                    : 'bg-amber-50/20 border-amber-200/80 shadow-2xs'
                  : day.isWeekend
                  ? 'bg-slate-50/60 border-slate-200/80'
                  : dayTotalNet > 0
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-white border-dashed border-slate-300'
              }`}
            >
              {/* Day Header Bar */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
                    <span
                      className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${
                        isDayOff
                          ? isDidNotWork
                            ? 'text-rose-950 font-bold'
                            : 'text-amber-950 font-bold'
                          : day.isWeekend
                          ? 'text-slate-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {day.dayName}, {day.formattedDate}
                    </span>

                    {dayOff ? (
                      isDidNotWork ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-900 bg-rose-100 border border-rose-300/80 px-1.5 sm:px-2 py-0.5 rounded-md">
                          <Ban className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-700" />
                          <span>{t.didNotWorkBadge}</span>
                          {dayOff.reason && dayOff.reason !== "Didn't work" && (
                            <span className="text-rose-800 font-medium truncate max-w-[100px] sm:max-w-[150px]">
                              · {dayOff.reason}
                            </span>
                          )}
                          {dayOff.isPaid && (
                            <span className="text-[9px] sm:text-[10px] bg-rose-200/80 text-rose-900 px-1 rounded font-bold uppercase">
                              {language === 'fr' ? 'Payé' : 'Paid'}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300/80 px-1.5 sm:px-2 py-0.5 rounded-md">
                          <Palmtree className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-700" />
                          <span>{t.dayOffBadge}</span>
                          {dayOff.reason && dayOff.reason !== 'Scheduled Day Off' && (
                            <span className="text-amber-800 font-medium truncate max-w-[100px] sm:max-w-[150px]">
                              · {dayOff.reason}
                            </span>
                          )}
                          {dayOff.isPaid && (
                            <span className="text-[9px] sm:text-[10px] bg-amber-200/80 text-amber-900 px-1 rounded font-bold uppercase">
                              {language === 'fr' ? 'Payé' : 'Paid'}
                            </span>
                          )}
                        </span>
                      )
                    ) : day.isWorkday && workdayNum ? (
                      <span className="text-[10px] sm:text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 sm:px-2 py-0.5 rounded-md">
                        {language === 'fr'
                          ? `Jour ouvré ${workdayNum}/${totalActiveWorkdays}`
                          : `Workday ${workdayNum}/${totalActiveWorkdays}`}
                      </span>
                    ) : null}

                    {day.isWeekend && !isDayOff && (
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md">
                        {language === 'fr' ? 'Weekend' : 'Weekend'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Desktop Day Off Action Buttons */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {isDayOff ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onRemoveDayOff(day.date)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-2xs"
                            title={t.restoreWorkdayBtn}
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>{t.restoreWorkdayBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDayOffModal(day.date, isDidNotWork ? 'did_not_work' : 'day_off')}
                            className={`inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-md transition-colors border ${
                              isDidNotWork
                                ? 'text-rose-900 bg-rose-100/70 hover:bg-rose-200/70 border-rose-300/70'
                                : 'text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 border-amber-300/70'
                            }`}
                            title={t.editStatusBtn}
                          >
                            {t.editStatusBtn}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenDayOffModal(day.date, 'day_off')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-amber-900 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-colors"
                            title={t.makeDayOffBtn}
                          >
                            <Palmtree className="w-3 h-3 text-amber-600" />
                            <span>{t.makeDayOffBtn}</span>
                          </button>
                          {day.date !== todayISO && (
                            <button
                              type="button"
                              onClick={() => onOpenDayOffModal(day.date, 'did_not_work')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-md transition-colors"
                              title={t.didNotWorkBtn}
                            >
                              <Ban className="w-3 h-3 text-rose-500" />
                              <span>{t.didNotWorkBtn}</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="text-right pl-1 sm:pl-2">
                      <span className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                        dayTotalNet === 0 ? 'text-slate-400' : 'text-slate-900'
                      }`}>
                        {dayTotalNet.toFixed(2)} {language === 'fr' ? 'h' : 'hrs'}
                      </span>
                      {isDayOff ? (
                        <span className={`text-[10px] sm:text-[11px] font-medium ml-1 ${isDidNotWork ? 'text-rose-700' : 'text-amber-700'}`}>
                          {isDidNotWork
                            ? (language === 'fr' ? 'Non trav.' : 'Unworked')
                            : (language === 'fr' ? 'Repos' : 'Off')}
                        </span>
                      ) : day.isWorkday ? (
                        <span className="text-[10px] sm:text-[11px] text-slate-400 ml-1">
                          / 8.0h
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAddModal(day.date)}
                      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-blue-700 bg-blue-50 hover:text-blue-800 hover:bg-blue-100 border border-blue-100 transition-colors"
                      title={`${t.addEntryBtn} ${day.formattedDate}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Day Off Actions Row */}
                <div className="sm:hidden flex items-center gap-1.5 pt-1.5 mt-1.5 border-t border-slate-100/80">
                  {isDayOff ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRemoveDayOff(day.date)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-md shadow-2xs"
                        title={t.restoreWorkdayBtn}
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-slate-500" />
                        <span>{t.restoreWorkdayBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDayOffModal(day.date, isDidNotWork ? 'did_not_work' : 'day_off')}
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                          isDidNotWork
                            ? 'text-rose-900 bg-rose-100/80 border-rose-300'
                            : 'text-amber-800 bg-amber-100/80 border-amber-300'
                        }`}
                        title={t.editStatusBtn}
                      >
                        {t.editStatusBtn}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenDayOffModal(day.date, 'day_off')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-amber-50 border border-slate-200 rounded-md"
                        title={t.makeDayOffBtn}
                      >
                        <Palmtree className="w-2.5 h-2.5 text-amber-600" />
                        <span>{t.makeDayOffBtn}</span>
                      </button>
                      {day.date !== todayISO && (
                        <button
                          type="button"
                          onClick={() => onOpenDayOffModal(day.date, 'did_not_work')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-rose-50 border border-slate-200 rounded-md"
                          title={t.didNotWorkBtn}
                        >
                          <Ban className="w-2.5 h-2.5 text-rose-500" />
                          <span>{t.didNotWorkBtn}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Punches List */}
              <div className="p-3">
                {dayOff && dayEntries.length > 0 && (
                  <div
                    className={`mb-2.5 px-3 py-1.5 text-xs rounded-lg border flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap ${
                      isDidNotWork
                        ? 'text-rose-950 bg-rose-50 border-rose-200'
                        : 'text-amber-900 bg-amber-50 border-amber-200'
                    }`}
                  >
                    <span className="font-medium">
                      {isDidNotWork
                        ? (language === 'fr'
                            ? `🚫 Marqué non travaillé (${dayOff.reason || "N'a pas travaillé"}) — Travail enregistré sur un jour non travaillé`
                            : `🚫 Marked Didn't Work (${dayOff.reason || "Didn't work"}) — Work recorded on unworked day`)
                        : (language === 'fr'
                            ? `🌴 Congé prévu (${dayOff.reason || 'Jour de repos'}) — Travail enregistré sur jour de congé`
                            : `🌴 Scheduled Day Off (${dayOff.reason || 'Scheduled Day Off'}) — Work recorded on day off`)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {isDayOff ? (
                        <div className="flex items-center gap-1.5">
                          {rawDayTotalNet > 0 && (
                            <span className="font-mono text-[11px] text-slate-400 line-through tabular-nums">
                              {rawDayTotalNet.toFixed(2)} {language === 'fr' ? 'h' : 'hrs'}
                            </span>
                          )}
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs shadow-2xs ${
                            isDidNotWork ? 'bg-rose-200/90 text-rose-950' : 'bg-amber-200/90 text-amber-950'
                          }`}>
                            0 hrs
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono font-bold tabular-nums">
                          {rawDayTotalNet.toFixed(2)} {language === 'fr' ? 'h' : 'hrs'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {dayEntries.length === 0 ? (
                  dayOff ? (
                    <div
                      className={`py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs rounded-lg border ${
                        isDidNotWork
                          ? 'bg-rose-50/50 border-rose-200/60'
                          : 'bg-amber-50/50 border-amber-200/50'
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${isDidNotWork ? 'text-rose-950' : 'text-amber-900'}`}>
                        {isDidNotWork ? (
                          <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <Palmtree className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold">
                            {isDidNotWork
                              ? `${t.didNotWorkBadge} (${dayOff.reason || (language === 'fr' ? 'Aucun travail effectué' : 'No work performed')})`
                              : `${t.dayOffBadge} (${dayOff.reason || (language === 'fr' ? 'Jour de repos' : 'Day Off')})`}
                          </span>
                          <span className={isDidNotWork ? 'text-rose-800/80 ml-2' : 'text-amber-800/80 ml-2'}>
                            {dayOff.notes
                              ? `— ${dayOff.notes}`
                              : isDidNotWork
                              ? (language === 'fr' ? '— Aucune heure travaillée à cette date.' : '— No hours worked on this date.')
                              : (language === 'fr' ? '— Aucun temps requis pour ce jour de repos.' : '— No time required for this day off.')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onRemoveDayOff(day.date)}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline transition-colors"
                        >
                          {t.restoreWorkdayBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDayOffModal(day.date, isDidNotWork ? 'did_not_work' : 'day_off')}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                            isDidNotWork
                              ? 'text-rose-900 bg-rose-100 hover:bg-rose-200'
                              : 'text-amber-900 bg-amber-100 hover:bg-amber-200'
                          }`}
                        >
                          {t.editStatusBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAddModal(day.date)}
                          className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {language === 'fr' ? '+ Ajouter' : '+ Add Punch'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2.5 px-3 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {day.isWeekend
                          ? (language === 'fr' ? 'Aucune heure enregistrée ce week-end' : 'No weekend punches recorded')
                          : (language === 'fr' ? 'Aucune heure enregistrée pour ce jour ouvré' : 'No time logged for this workday')}
                      </span>
                      <div className="flex items-center gap-2">
                        {day.isWorkday && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenDayOffModal(day.date, 'day_off')}
                              className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                            >
                              {t.makeDayOffBtn}
                            </button>
                            {day.date !== todayISO && (
                              <button
                                type="button"
                                onClick={() => onOpenDayOffModal(day.date, 'did_not_work')}
                                className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors"
                              >
                                {t.didNotWorkBtn}
                              </button>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenAddModal(day.date)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {language === 'fr' ? '+ Ajouter' : '+ Add Punch'}
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map((entry) => {
                      const proj = projectMap.get(entry.projectId);

                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200/70 transition-colors"
                        >
                          {/* Top on mobile / Left on desktop: Project & Net Hours */}
                          <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-1.5 h-6 sm:h-9 rounded-full shrink-0"
                                style={{ backgroundColor: proj?.color || '#3B82F6' }}
                              />
                              <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                {/* Small color-coding indicator dot next to the project name */}
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/15 shadow-2xs"
                                  style={{
                                    backgroundColor:
                                      proj?.tagColor || proj?.colorCode || proj?.color || '#3B82F6',
                                  }}
                                  title={`Tag color: ${proj?.name || 'Project'}`}
                                  aria-hidden="true"
                                />
                                <span className="font-semibold text-xs text-slate-900 truncate">
                                  {proj?.name || 'Unknown Project'}
                                </span>
                                {proj?.code && !proj?.name?.includes(proj.code) && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white border border-slate-200 rounded text-slate-600">
                                    {proj.code}
                                  </span>
                                )}
                                {entry.isOvertime && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                    OT
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Net hours on mobile top right */}
                            <div className="sm:hidden font-mono text-xs font-bold tabular-nums shrink-0">
                              {isDayOff ? (
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  isDidNotWork ? 'text-rose-900 bg-rose-100' : 'text-amber-900 bg-amber-100'
                                }`}>
                                  <span className="text-slate-400">0.00</span> {language === 'fr' ? 'h' : 'hrs'}
                                </span>
                              ) : (
                                <span className={entry.netHours === 0 ? 'text-slate-400' : 'text-slate-900'}>
                                  {entry.netHours.toFixed(2)} {language === 'fr' ? 'h' : 'hrs'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom on mobile / Right on desktop: Timestamps, break & actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 text-xs shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px] sm:text-xs tabular-nums">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                <span>{formatTime12h(entry.startTime)}</span>
                                <span className="text-slate-400">→</span>
                                <span>{formatTime12h(entry.endTime)}</span>
                              </div>

                              {(() => {
                                const isZeroWorkDay = isDayOff || dayTotalNet <= 0;
                                return (
                                  <div
                                    className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                                      isZeroWorkDay
                                        ? 'text-slate-400 bg-slate-100/70 border-slate-200'
                                        : 'text-slate-500 bg-white border-slate-200/80'
                                    }`}
                                    title={isZeroWorkDay ? (language === 'fr' ? 'Jour à 0.00h : pause non décomptée' : '0.00h work day: meal break not counted') : undefined}
                                  >
                                    <Coffee className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isZeroWorkDay ? 'text-slate-400' : 'text-amber-600'}`} />
                                    <span>
                                      {isZeroWorkDay
                                        ? (language === 'fr' ? '0 min (0h trav.)' : '0 min (0h work)')
                                        : `${Math.floor(entry.breakMinutes / 60)}h ${entry.breakMinutes % 60}m`}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Net hours on desktop */}
                              <div className="hidden sm:block font-mono text-xs font-bold tabular-nums min-w-[55px] text-right">
                                {isDayOff ? (
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    <span className="text-[11px] text-slate-400 line-through font-normal">
                                      {entry.netHours.toFixed(2)}
                                    </span>
                                    <span className={`font-bold px-1 rounded text-[11px] ${
                                      isDidNotWork ? 'text-rose-900 bg-rose-100' : 'text-amber-900 bg-amber-100'
                                    }`} title="Unworked day: not counted in worked hours">
                                      <span className="text-slate-400">0.00</span> {language === 'fr' ? 'h' : 'hrs'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className={entry.netHours === 0 ? 'text-slate-400' : 'text-slate-900'}>
                                    {entry.netHours.toFixed(2)} {language === 'fr' ? 'h' : 'hrs'}
                                  </span>
                                )}
                              </div>

                              {/* Actions: Edit & Delete */}
                              <div className="flex items-center gap-0.5 pl-1.5 sm:pl-2 border-l border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(entry)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                                  title="Edit entry"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteEntry(entry.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
