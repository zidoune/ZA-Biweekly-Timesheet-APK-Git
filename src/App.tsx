/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Header } from './components/Header';
import { LiveTimerBar } from './components/LiveTimerBar';
import { PeriodSummaryCards } from './components/PeriodSummaryCards';
import { TimesheetGrid } from './components/TimesheetGrid';
import { EntryModal } from './components/EntryModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { PdfAuditModal } from './components/PdfAuditModal';
import { SheetPersonnelHeader } from './components/SheetPersonnelHeader';
import { DayOffModal } from './components/DayOffModal';
import { ApkExportModal } from './components/ApkExportModal';
import { DailyHoursChart } from './components/DailyHoursChart';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EnterForAnotherEmployeeModal } from './components/EnterForAnotherEmployeeModal';
import { useLanguage } from './context/LanguageContext';
import {
  BiweeklyPeriod,
  DayOff,
  ManagedEmployee,
  Project,
  TimeEntry,
  TimesheetProfile,
} from './types/timesheet';
import {
  generateBiweeklyPeriods,
  getBiweeklyDays,
  toISODateString,
} from './utils/dateUtils';
import {
  loadDaysOff,
  loadEntries,
  loadProfile,
  loadProjects,
  loadManagedEmployees,
  saveManagedEmployees,
  loadActiveEmployeeId,
  saveActiveEmployeeId,
  saveDaysOff,
  saveEntries,
  saveProfile,
  saveProjects,
  INITIAL_ENTRIES,
  INITIAL_PROJECTS,
  INITIAL_PROFILE,
} from './utils/storage';

export default function App() {
  // 1. Periods generation anchored around current October 2026 date
  const periods = useMemo(() => {
    // Current date is Oct 9, 2026. Anchor Monday is Oct 5, 2026.
    const anchor = new Date(2026, 9, 5); // Month is 0-indexed (9 = Oct)
    return generateBiweeklyPeriods(anchor, 4, 8);
  }, []);

  // Find period that covers today
  const defaultPeriod = useMemo(() => {
    const todayISO = toISODateString(new Date());
    const found = periods.find(
      (p) => todayISO >= p.startDate && todayISO <= p.endDate
    );
    return found || periods[4] || periods[0];
  }, [periods]);

  const [currentPeriod, setCurrentPeriod] = useState<BiweeklyPeriod>(defaultPeriod);

  // 2. Persistent state
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [entries, setEntries] = useState<TimeEntry[]>(loadEntries);
  const [profile, setProfile] = useState<TimesheetProfile>(loadProfile);
  const [daysOff, setDaysOff] = useState<DayOff[]>(loadDaysOff);
  const [managedEmployees, setManagedEmployees] = useState<ManagedEmployee[]>(loadManagedEmployees);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(loadActiveEmployeeId);

  // Save to localStorage when state updates
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveDaysOff(daysOff);
  }, [daysOff]);

  useEffect(() => {
    saveManagedEmployees(managedEmployees);
  }, [managedEmployees]);

  useEffect(() => {
    saveActiveEmployeeId(activeEmployeeId);
  }, [activeEmployeeId]);

  // Automatic on-device safety backup: refreshed whenever timesheet data changes.
  // This is a local recovery snapshot stored only on this device.
  useEffect(() => {
    try {
      const backup = {
        schemaVersion: 1,
        appName: 'ZA Biweekly Timesheet',
        backedUpAt: new Date().toISOString(),
        profile, projects, entries, daysOff, managedEmployees, activeEmployeeId,
      };
      localStorage.setItem('za_timesheet_auto_backup_v1', JSON.stringify(backup));
    } catch (error) {
      console.warn('Automatic local backup could not be updated:', error);
    }
  }, [profile, projects, entries, daysOff, managedEmployees, activeEmployeeId]);

  // 3. Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEnterForAnotherOpen, setIsEnterForAnotherOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDayOffModalOpen, setIsDayOffModalOpen] = useState(false);
  const [dayOffTargetDate, setDayOffTargetDate] = useState<string>('');
  const [dayOffModalMode, setDayOffModalMode] = useState<'day_off' | 'did_not_work'>('day_off');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>('');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);
  const [chartWeekTab, setChartWeekTab] = useState<'all' | 'w1' | 'w2'>('all');

  const activeEmployee = useMemo(
    () =>
      managedEmployees.find(
        (e) => e.employeeId.toUpperCase() === (activeEmployeeId || '').toUpperCase()
      ) || null,
    [managedEmployees, activeEmployeeId]
  );

  const effectiveProfile: TimesheetProfile = useMemo(() => {
    if (!activeEmployee) return profile;
    return {
      ...profile,
      employeeName: activeEmployee.employeeName,
      employeeId: activeEmployee.employeeId,
      employeeEmail: activeEmployee.employeeEmail || '',
      employeePhone: activeEmployee.employeePhone || profile.employeePhone,
      title: activeEmployee.title || 'Crew Member',
      department: activeEmployee.department || profile.department,
      supervisorName: activeEmployee.supervisorName || profile.employeeName,
      defaultHourlyRate: activeEmployee.defaultHourlyRate ?? profile.defaultHourlyRate,
      dailyStandardHours: activeEmployee.dailyStandardHours ?? profile.dailyStandardHours,
    };
  }, [profile, activeEmployee]);

  const handleViewWeekChart = (tab: 'w1' | 'w2') => {
    setIsChartExpanded(true);
    setChartWeekTab(tab);
    setTimeout(() => {
      const el = document.getElementById('daily-hours-chart-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const { dateLocale, t } = useLanguage();

  // 4. Current period days and filtered entries
  const periodDays = useMemo(
    () => getBiweeklyDays(currentPeriod.startDate, dateLocale),
    [currentPeriod.startDate, dateLocale]
  );

  const periodDateSet = useMemo(
    () => new Set(periodDays.map((d) => d.date)),
    [periodDays]
  );

  // Filter entries for the currently active subject (contractor or delegated employee)
  const currentSubjectEntries = useMemo(() => {
    if (!activeEmployee) {
      const contractorId = (profile.employeeId || 'EMP-001').toUpperCase();
      return entries.filter(
        (e) => !(e as any).employeeId || (e as any).employeeId.toUpperCase() === contractorId
      );
    }
    const targetId = activeEmployee.employeeId.toUpperCase();
    return entries.filter(
      (e) => (e as any).employeeId && (e as any).employeeId.toUpperCase() === targetId
    );
  }, [entries, activeEmployee, profile.employeeId]);

  const currentPeriodEntries = useMemo(
    () => currentSubjectEntries.filter((e) => periodDateSet.has(e.date)),
    [currentSubjectEntries, periodDateSet]
  );

  // Total effective net hours for the current pay period (excluding all unworked days / days off)
  const totalPeriodNetHours = useMemo(() => {
    const unworkedDaySet = new Set(
      daysOff
        .filter((d) => periodDateSet.has(d.date))
        .map((d) => d.date)
    );
    return currentPeriodEntries.reduce((sum, e) => {
      if (unworkedDaySet.has(e.date)) return sum;
      return sum + e.netHours;
    }, 0);
  }, [currentPeriodEntries, daysOff, periodDateSet]);

  // 5. Entry Actions
  const handleOpenAddModal = (targetDateISO?: string) => {
    setEditingEntry(null);
    setModalDefaultDate(targetDateISO || currentPeriod.startDate);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setModalDefaultDate(entry.date);
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (entryData: Omit<TimeEntry, 'id'> | TimeEntry) => {
    const targetEmpId = activeEmployee ? activeEmployee.employeeId : (profile.employeeId || 'EMP-001');
    const targetEntry: TimeEntry =
      'id' in entryData
        ? ({ ...entryData, employeeId: (entryData as any).employeeId || targetEmpId } as TimeEntry)
        : {
            ...entryData,
            employeeId: targetEmpId,
            id: `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          };

    setEntries((prev) => {
      const exists = prev.some((e) => e.id === targetEntry.id);
      return exists
        ? prev.map((e) => (e.id === targetEntry.id ? targetEntry : e))
        : [...prev, targetEntry];
    });

  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this punch record?')) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const handleCommitLivePunch = (newEntryData: Omit<TimeEntry, 'id'>) => {
    const targetEmpId = activeEmployee ? activeEmployee.employeeId : (profile.employeeId || 'EMP-001');
    const newEntry: TimeEntry = {
      ...newEntryData,
      employeeId: targetEmpId,
      id: `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const handleAddNewEmployee = (newEmp: ManagedEmployee) => {
    setManagedEmployees((prev) => [
      ...prev.filter((e) => e.employeeId.toUpperCase() !== newEmp.employeeId.toUpperCase()),
      newEmp,
    ]);
  };

  const handleDeleteEmployee = (empDocId: string) => {
    const toDelete = managedEmployees.find((e) => e.id === empDocId);
    setManagedEmployees((prev) => prev.filter((e) => e.id !== empDocId));
    if (toDelete && activeEmployeeId === toDelete.employeeId) {
      setActiveEmployeeId(null);
    }
  };

  const handleSelectEmployee = (emp: ManagedEmployee) => {
    setActiveEmployeeId(emp.employeeId);
  };

  const handleSwitchBackToMyTimesheet = () => {
    setActiveEmployeeId(null);
  };

  // 5.1 Day Off Actions
  const handleOpenDayOffModal = (
    targetDateISO: string,
    mode: 'day_off' | 'did_not_work' = 'day_off'
  ) => {
    setDayOffTargetDate(targetDateISO);
    setDayOffModalMode(mode);
    setIsDayOffModalOpen(true);
  };

  const handleSaveDayOff = (newDayOff: DayOff) => {
    setDaysOff((prev) => {
      const filtered = prev.filter((d) => d.date !== newDayOff.date);
      return [...filtered, newDayOff];
    });
  };

  const handleRemoveDayOff = (targetDateISO: string) => {
    setDaysOff((prev) => prev.filter((d) => d.date !== targetDateISO));
  };

  const handleUpdateProfile = (newProfile: TimesheetProfile) => {
    const prevEmployer = profile.employerName;
    setProfile(newProfile);
    saveProfile(newProfile);
    // If employer / client name changed, update projects belonging to the previous client or Oakridge Custom Homes
    if (newProfile.employerName && prevEmployer && newProfile.employerName !== prevEmployer) {
      const updatedProjects = projects.map((proj) =>
        proj.client.toLowerCase() === prevEmployer.toLowerCase() ||
        proj.client.toLowerCase() === 'oakridge custom homes'
          ? { ...proj, client: newProfile.employerName }
          : proj
      );
      handleSaveProjects(updatedProjects);
    }
  };

  const handleUpdateClientName = (newClientName: string) => {
    const trimmed = newClientName.trim();
    if (!trimmed) return;
    const prevEmployer = profile.employerName || 'Oakridge Custom Homes';
    const updatedProfile = { ...profile, employerName: trimmed };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
    const updatedProjects = projects.map((proj) =>
      proj.client.toLowerCase() === prevEmployer.toLowerCase() ||
      proj.client.toLowerCase() === 'oakridge custom homes'
        ? { ...proj, client: trimmed }
        : proj
    );
    handleSaveProjects(updatedProjects);
  };

  const handleSaveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  // 6. Settings & Reset Actions
  const handleResetData = () => {
    if (
      window.confirm(
        'Reset timesheet data to initial demo state? Any custom punches will be overwritten.'
      )
    ) {
      setProjects(INITIAL_PROJECTS);
      setEntries(INITIAL_ENTRIES);
      setProfile(INITIAL_PROFILE);
      setDaysOff([]);
      saveProjects(INITIAL_PROJECTS);
      saveEntries(INITIAL_ENTRIES);
      saveProfile(INITIAL_PROFILE);
      saveDaysOff([]);
      setIsSettingsModalOpen(false);
    }
  };

  const allDataJson = useMemo(() => {
    return JSON.stringify(
      {
        profile,
        projects,
        entries,
        daysOff,
        managedEmployees,
        activeEmployeeId,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [profile, projects, entries, daysOff, managedEmployees, activeEmployeeId]);

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.projects) setProjects(parsed.projects);
      if (parsed.entries) setEntries(parsed.entries);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.daysOff && Array.isArray(parsed.daysOff)) setDaysOff(parsed.daysOff);
      if (parsed.managedEmployees && Array.isArray(parsed.managedEmployees)) setManagedEmployees(parsed.managedEmployees);
      if ('activeEmployeeId' in parsed) setActiveEmployeeId(parsed.activeEmployeeId ?? null);
    } catch (e) {
      console.error('Import error:', e);
      throw e;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Contract Navigation */}
      <Header
        periods={periods}
        currentPeriod={currentPeriod}
        onSelectPeriod={setCurrentPeriod}
        profile={effectiveProfile}
        totalPeriodHours={totalPeriodNetHours}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6">
        {/* Contractor Delegation Banner: Shown when entering timesheet on behalf of another employee */}
        {activeEmployee && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 sm:p-4 text-amber-950 dark:text-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200 dark:bg-amber-800/80 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-300 dark:border-amber-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/90 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-2 py-0.5 rounded-full">
                    Contractor Delegation Mode
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200 bg-white/70 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-amber-300/80 dark:border-amber-700">
                    Employee ID: {activeEmployee.employeeId}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Entering Timesheet for: {activeEmployee.employeeName}
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400 ml-2">
                    ({activeEmployee.title || 'Crew Member'} · {activeEmployee.department || 'Field Operations'})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsEnterForAnotherOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-700 transition-colors shadow-2xs"
              >
                Change Employee
              </button>
              <button
                type="button"
                onClick={handleSwitchBackToMyTimesheet}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 shadow-xs transition-colors"
              >
                Back to My Timesheet ({profile.employeeName.split(' ')[0]})
              </button>
            </div>
          </div>
        )}

        {/* Top of Sheet: Employee Name, Employee Phone, Employer Name, Employer Phone & Editable Hourly Rate */}
        <section aria-label="Sheet Personnel Header">
          <SheetPersonnelHeader
            profile={effectiveProfile}
            onUpdateProfile={(updated) => {
              if (activeEmployee) {
                handleAddNewEmployee({
                  ...activeEmployee,
                  employeeName: updated.employeeName,
                  employeePhone: updated.employeePhone,
                  employeeEmail: updated.employeeEmail,
                  defaultHourlyRate: updated.defaultHourlyRate,
                });
              } else {
                handleUpdateProfile(updated);
              }
            }}
            onUpdateClientName={handleUpdateClientName}
            onUpdateHourlyRate={(newRate) => {
              if (activeEmployee) {
                handleAddNewEmployee({
                  ...activeEmployee,
                  defaultHourlyRate: newRate,
                });
              } else {
                const updatedProfile = { ...profile, defaultHourlyRate: newRate };
                handleUpdateProfile(updatedProfile);
                const updatedProjects = projects.map((proj) =>
                  proj.name.toLowerCase().includes('residential') ||
                  proj.name.toLowerCase().includes('custom house')
                    ? { ...proj, rate: newRate }
                    : proj
                );
                handleSaveProjects(updatedProjects);
              }
            }}
          />
        </section>

        {/* Live Punch Stopwatch Bar */}
        <section aria-label="Live punch timer">
          <LiveTimerBar
            projects={projects}
            defaultBreakMinutes={profile.defaultBreakMinutes}
            onCommitEntry={handleCommitLivePunch}
          />
        </section>

        {/* Tabular KPI Strip */}
        <section aria-label="Biweekly period KPI metrics">
          <PeriodSummaryCards
            entries={currentPeriodEntries}
            projects={projects}
            profile={effectiveProfile}
            daysOff={daysOff}
            periodDateSet={periodDateSet}
            periodDays={periodDays}
            activeChartTab={isChartExpanded ? chartWeekTab : undefined}
            onViewWeekChart={handleViewWeekChart}
          />
        </section>

        {/* Full-Width 14-Day Schedule Grid */}
        <section className="space-y-4">
          <TimesheetGrid
            days={periodDays}
            entries={currentPeriodEntries}
            projects={projects}
            daysOff={daysOff}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteEntry={handleDeleteEntry}
            onOpenDayOffModal={handleOpenDayOffModal}
            onRemoveDayOff={handleRemoveDayOff}
          />

          {/* 14-Day Audit Compliance Footer Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">14-Day Biweekly Schedule Rules:</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                10 standard working days (Mon–Fri, 80h standard) · Working days can be designated as Days Off (PTO, Holiday, Leave) · Unpaid meal breaks deducted
              </span>
            </div>
            <div className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-1 rounded shrink-0">
              Audit Ready
            </div>
          </div>
        </section>

        {/* Daily Hours Worked vs. Standard 8h Target Visual Chart at Bottom with Show/Hide Button */}
        <section aria-label="Daily hours visual chart">
          <DailyHoursChart
            entries={currentPeriodEntries}
            projects={projects}
            profile={effectiveProfile}
            daysOff={daysOff}
            periodDateSet={periodDateSet}
            periodDays={periodDays}
            isExpanded={isChartExpanded}
            onToggleExpand={() => setIsChartExpanded((prev) => !prev)}
            selectedTab={chartWeekTab}
            onTabChange={setChartWeekTab}
          />
        </section>
      </main>

      {/* Modals */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
        defaultDate={modalDefaultDate}
        projects={projects}
        defaultBreakMinutes={profile.defaultBreakMinutes}
        daysOff={daysOff}
      />

      <DayOffModal
        isOpen={isDayOffModalOpen}
        onClose={() => setIsDayOffModalOpen(false)}
        dateISO={dayOffTargetDate}
        existingDayOff={daysOff.find((d) => d.date === dayOffTargetDate)}
        initialMode={dayOffModalMode}
        onSaveDayOff={handleSaveDayOff}
        onRemoveDayOff={handleRemoveDayOff}
      />

      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        onSaveProjects={handleSaveProjects}
        profile={profile}
        onUpdateClientName={handleUpdateClientName}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
        onResetData={handleResetData}
        allDataJson={allDataJson}
        onImportData={handleImportData}
        onUpdateClientName={handleUpdateClientName}
        onOpenEnterForAnother={() => setIsEnterForAnotherOpen(true)}
      />

      <EnterForAnotherEmployeeModal
        isOpen={isEnterForAnotherOpen}
        onClose={() => setIsEnterForAnotherOpen(false)}
        contractorProfile={profile}
        managedEmployees={managedEmployees}
        activeEmployeeId={activeEmployeeId}
        onSelectEmployee={handleSelectEmployee}
        onAddNewEmployee={handleAddNewEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onSwitchBackToContractor={handleSwitchBackToMyTimesheet}
      />

      {isPdfModalOpen && (
        <PdfAuditModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          period={currentPeriod}
          profile={effectiveProfile}
          projects={projects}
          entries={entries}
          daysOff={daysOff}
        />
      )}

      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
