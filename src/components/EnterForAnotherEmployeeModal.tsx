import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Check,
  UserCheck,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  Sparkles,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ManagedEmployee, TimesheetProfile } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';

interface EnterForAnotherEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorProfile: TimesheetProfile;
  managedEmployees: ManagedEmployee[];
  activeEmployeeId: string | null;
  onSelectEmployee: (employee: ManagedEmployee) => void;
  onAddNewEmployee: (employee: ManagedEmployee) => void;
  onDeleteEmployee?: (employeeId: string) => void;
  onSwitchBackToContractor: () => void;
}

export const EnterForAnotherEmployeeModal: React.FC<EnterForAnotherEmployeeModalProps> = ({
  isOpen,
  onClose,
  contractorProfile,
  managedEmployees,
  activeEmployeeId,
  onSelectEmployee,
  onAddNewEmployee,
  onDeleteEmployee,
  onSwitchBackToContractor,
}) => {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<'roster' | 'add'>('roster');

  // Form state for adding new employee
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeEmail, setEmployeeEmail] = useState<string>('');
  const [employeePhone, setEmployeePhone] = useState<string>('');
  const [title, setTitle] = useState<string>('Carpenter / Framer');
  const [department, setDepartment] = useState<string>('Residential Construction');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(contractorProfile.defaultHourlyRate ?? 30);
  const [dailyStandardHours, setDailyStandardHours] = useState<number>(8.0);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate a unique Employee ID (e.g. EMP-204)
  const handleGenerateId = () => {
    let nextId = '';
    let counter = 101;
    const existingIds = new Set(
      [contractorProfile.employeeId || 'EMP-001', ...managedEmployees.map((e) => e.employeeId.toUpperCase())]
    );

    while (counter < 999) {
      const candidate = `EMP-${counter}`;
      if (!existingIds.has(candidate.toUpperCase())) {
        nextId = candidate;
        break;
      }
      counter++;
    }

    if (!nextId) {
      nextId = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    }

    setEmployeeId(nextId);
    setFormError(null);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanId = employeeId.trim().toUpperCase();
    const cleanName = employeeName.trim();

    if (!cleanId) {
      setFormError(
        language === 'fr'
          ? "L'identifiant de l'employé est requis (chaque employé a un ID unique)."
          : 'Employee ID is required (each added employee will have a unique ID).'
      );
      return;
    }

    if (!cleanName) {
      setFormError(
        language === 'fr'
          ? "Le nom de l'employé est requis."
          : 'Employee full name is required.'
      );
      return;
    }

    // Check for ID collision against existing employees or contractor's own ID
    const isDuplicateId =
      cleanId === (contractorProfile.employeeId || 'EMP-001').toUpperCase() ||
      managedEmployees.some((emp) => emp.employeeId.toUpperCase() === cleanId);

    if (isDuplicateId) {
      setFormError(
        language === 'fr'
          ? `L'identifiant "${cleanId}" est déjà attribué. Chaque employé doit avoir un identifiant unique.`
          : `Employee ID "${cleanId}" is already in use. Each added employee will have a unique ID.`
      );
      return;
    }

    const newEmp: ManagedEmployee = {
      id: `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: cleanId,
      employeeName: cleanName,
      employeeEmail: employeeEmail.trim() || undefined,
      employeePhone: employeePhone.trim() || undefined,
      title: title.trim() || 'Crew Member',
      department: department.trim() || 'Field Operations',
      supervisorName: contractorProfile.employeeName,
      defaultHourlyRate: Number(defaultHourlyRate) || (contractorProfile.defaultHourlyRate ?? 30),
      dailyStandardHours: Number(dailyStandardHours) || 8.0,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddNewEmployee(newEmp);
    onSelectEmployee(newEmp);

    setSuccessNotice(
      language === 'fr'
        ? `Employé ${cleanName} (${cleanId}) ajouté avec succès ! Feuille de temps activée.`
        : `Employee ${cleanName} (${cleanId}) registered! Timesheet active.`
    );

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const currentActiveEmployee = managedEmployees.find(
    (e) => e.employeeId === activeEmployeeId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Enter Timesheet for Another Employee</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 hidden sm:inline-block">
                  Contractor Delegation
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log hours and manage timesheet records for crew members under unique Employee IDs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contractor Permission Verified Status Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Authorized Contractor: <strong className="text-slate-900 dark:text-white">{contractorProfile.employeeName}</strong>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                (ID: {contractorProfile.employeeId || 'EMP-001'})
              </span>
            </span>
          </div>

          {activeEmployeeId && currentActiveEmployee && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                Active: {currentActiveEmployee.employeeName} ({currentActiveEmployee.employeeId})
              </span>
              <button
                type="button"
                onClick={() => {
                  onSwitchBackToContractor();
                  onClose();
                }}
                className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline"
              >
                Reset to My Timesheet
              </button>
            </div>
          )}
        </div>

        {/* View Selection Tabs */}
        <div className="px-4 sm:px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTab('roster');
              setFormError(null);
            }}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'roster'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Select Existing Employee ({managedEmployees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('add');
              setFormError(null);
              if (!employeeId) handleGenerateId();
            }}
            className={`pb-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'add'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Employee</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {successNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {formError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: Roster & Quick Switch */}
          {tab === 'roster' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Crew Members & Subcontractors
                </h3>
                <span className="text-[11px] text-slate-400">
                  Select an employee to open their timesheet
                </span>
              </div>

              {/* Contractor's Own Timesheet Option */}
              <div
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !activeEmployeeId
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {(contractorProfile.employeeName || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {contractorProfile.employeeName} (You)
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {contractorProfile.employeeId || 'EMP-001'}
                      </span>
                      {!activeEmployeeId && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                          Currently Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {contractorProfile.title} · {contractorProfile.currencySymbol || '$'}{contractorProfile.defaultHourlyRate ?? 95}/hr
                    </p>
                  </div>
                </div>

                {!activeEmployeeId ? (
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1 self-end sm:self-center">
                    <Check className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchBackToContractor();
                      onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors self-end sm:self-center"
                  >
                    <span>Switch to My Timesheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Managed Employees List */}
              {managedEmployees.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-3">
                  <UserPlus className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No additional employees registered yet
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Add crew members with unique Employee IDs to log hours and punch entries on their behalf.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('add');
                      handleGenerateId();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add First Employee</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {managedEmployees.map((emp) => {
                    const isSelected = activeEmployeeId === emp.employeeId;
                    return (
                      <div
                        key={emp.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-600">
                            {emp.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {emp.employeeName}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                ID: {emp.employeeId}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                  Currently Entering
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{emp.title || 'Crew Member'}</span>
                              <span>·</span>
                              <span>{emp.department || 'Field'}</span>
                              <span>·</span>
                              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {contractorProfile.currencySymbol || '$'}{emp.defaultHourlyRate ?? 85}/hr
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={onClose}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 rounded-lg transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Currently Active</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectEmployee(emp);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
                            >
                              <span>Enter Timesheet</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteEmployee && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove employee "${emp.employeeName}" (${emp.employeeId}) from directory?`
                                  )
                                ) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Delete employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Add New Employee Form */}
          {tab === 'add' && (
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Unique Employee ID:</strong> Each employee added must have a unique identifier for project timesheets and payroll compliance. Use manual entry or click <em>Generate ID</em>.
                </p>
              </div>

              {/* Row 1: Employee ID & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Field: Employee ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Employee ID <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                      Unique ID
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value.toUpperCase());
                        setFormError(null);
                      }}
                      placeholder="e.g. EMP-104"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateId}
                      className="px-2.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg shrink-0 border border-slate-200 dark:border-slate-600 transition-colors"
                      title="Auto-generate a unique Employee ID"
                    >
                      Generate
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Each added Employee will have a unique ID.
                  </span>
                </div>

                {/* Field: Employee Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g. David Martinez"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Full name on audit timesheet & punch sign-offs.
                  </span>
                </div>
              </div>

              {/* Row 2: Trade / Job Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Job Title / Trade
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Framer, Carpenter, Electrician"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Department / Crew
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Residential Construction, Crew B"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Hourly Rate & Daily Standard Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Default Base Rate ({contractorProfile.currencySymbol || '$'}/hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Daily Standard Hours (Target)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="0.5"
                    value={dailyStandardHours}
                    onChange={(e) => setDailyStandardHours(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Contact Info (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Employee Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="employee@oakridgehomes.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Employee Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={employeePhone}
                    onChange={(e) => setEmployeePhone(e.target.value)}
                    placeholder="(555) 345-6789"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTab('roster')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Enter Timesheet</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
