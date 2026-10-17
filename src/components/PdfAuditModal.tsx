import React, { useState, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  X,
  Download,
  ExternalLink,
  Printer,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  PenTool,
  MessageSquare,
  Check,
  Building,
  UserCheck,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  BiweeklyPeriod,
  CustomSignatureConfig,
  DayOff,
  Project,
  TimeEntry,
  TimesheetProfile,
} from '../types/timesheet';
import { formatTime12h, getBiweeklyDays, getLastWorkingDay } from '../utils/dateUtils';
import { generateTimesheetPdf } from '../utils/pdfGenerator';
import { useLanguage } from '../context/LanguageContext';

interface PdfAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: BiweeklyPeriod;
  profile: TimesheetProfile;
  projects: Project[];
  entries: TimeEntry[];
  daysOff?: DayOff[];
}

export const PdfAuditModal: React.FC<PdfAuditModalProps> = ({
  isOpen,
  onClose,
  period,
  profile,
  projects,
  entries,
  daysOff = [],
}) => {
  const { t, language, dateLocale } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // 1. Project Notes Toggle & Selection State (Disabled by default to keep PDF compact)
  const [includeProjectNotes, setIncludeProjectNotes] = useState<boolean>(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState<boolean>(true);

  // 2. Custom Signature Line State
  const [customSignatureEnabled, setCustomSignatureEnabled] = useState<boolean>(false);
  const [customSigPreset, setCustomSigPreset] = useState<string>('client');
  const [customSigTitle, setCustomSigTitle] = useState<string>('Client / General Contractor Acceptance');
  const [customSigName, setCustomSigName] = useState<string>('Mark Callahan');
  const [customSigStatement, setCustomSigStatement] = useState<string>(
    'Work inspected, punch intervals verified, and approved in full compliance with project specifications.'
  );
  const [isManualInk, setIsManualInk] = useState<boolean>(false);
  const [customSigDate, setCustomSigDate] = useState<string>('');
  const [selectedProjectIdsForNotes, setSelectedProjectIdsForNotes] = useState<string[]>([]);

  // Mapping & calculations
  const unworkedDaySet = useMemo(() => new Set(daysOff.map((d) => d.date)), [daysOff]);

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
    return getBiweeklyDays(period.startDate, dateLocale);
  }, [period.startDate, dateLocale]);

  const periodDateSet = useMemo(() => new Set(periodDays.map((d) => d.date)), [periodDays]);
  const periodDaysOff = useMemo(() => daysOff.filter((d) => periodDateSet.has(d.date)), [daysOff, periodDateSet]);
  const periodDaysOffCount = periodDaysOff.length;
  const lastWorkingDayDate = useMemo(() => getLastWorkingDay(periodDays, daysOff, entries), [periodDays, daysOff, entries]);

  const periodEntries = useMemo(() => {
    return entries
      .filter((e) => periodDateSet.has(e.date))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [entries, periodDateSet]);

  // List of projects that actually appear in this biweekly period
  const activePeriodProjects = useMemo(() => {
    const activeProjIds = new Set(periodEntries.map((e) => e.projectId));
    return projects.filter((p) => activeProjIds.has(p.id));
  }, [projects, periodEntries]);

  // Map total effective worked hours per date to determine if a day has 0.00 hours of work
  const dailyWorkedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    periodEntries.forEach((e) => {
      const eff = unworkedDaySet.has(e.date) ? 0 : e.netHours;
      map.set(e.date, (map.get(e.date) || 0) + eff);
    });
    return map;
  }, [periodEntries, unworkedDaySet]);

  // Initialize custom signature date to last working day date
  React.useEffect(() => {
    if (!customSigDate && lastWorkingDayDate) {
      setCustomSigDate(lastWorkingDayDate);
    }
  }, [lastWorkingDayDate, customSigDate]);

  // Keep selectedProjectIdsForNotes in sync when activePeriodProjects change
  React.useEffect(() => {
    if (selectedProjectIdsForNotes.length === 0 && activePeriodProjects.length > 0) {
      setSelectedProjectIdsForNotes(activePeriodProjects.map((p) => p.id));
    }
  }, [activePeriodProjects, selectedProjectIdsForNotes.length]);

  const getEffectiveNet = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    return e.netHours;
  };

  // Do not count meal breaks when there is 0.00 hours of work in that day
  const getEffectiveBreakMinutes = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    const dayWorked = dailyWorkedHoursMap.get(e.date) || 0;
    if (dayWorked <= 0) return 0;
    return e.breakMinutes || 0;
  };

  const totalNetHours = periodEntries.reduce((sum, e) => sum + getEffectiveNet(e), 0);
  const totalBreakMinutes = periodEntries.reduce((sum, e) => sum + getEffectiveBreakMinutes(e), 0);
  const effectiveTargetDays = Math.max(0, profile.targetWorkingDays - periodDaysOffCount);
  const targetHours = effectiveTargetDays * profile.dailyStandardHours;
  const otThreshold = profile.overtimeThreshold != null && profile.overtimeThreshold > 0
    ? profile.overtimeThreshold
    : targetHours;
  const regularHours = Math.min(totalNetHours, otThreshold);
  const overtimeHours = Math.max(0, totalNetHours - otThreshold);
  const otMultiplier = profile.overtimeRateMultiplier || 1.5;
  const baseRate = profile.defaultHourlyRate != null ? profile.defaultHourlyRate : 30;

  // Gross Pay: strictly Total Net Hours multiplied by Base Hourly Rate
  const grossPay = totalNetHours * baseRate;

  // Project selection handlers
  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIdsForNotes((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIdsForNotes(activePeriodProjects.map((p) => p.id));
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIdsForNotes([]);
  };

  // Custom signature preset handler
  const handlePresetChange = (preset: string) => {
    setCustomSigPreset(preset);
    switch (preset) {
      case 'client':
        setCustomSigTitle('Client / General Contractor Acceptance');
        setCustomSigStatement('Work inspected, punch intervals verified, and approved in full compliance with project specifications.');
        break;
      case 'gc':
        setCustomSigTitle('General Contractor Authorization');
        setCustomSigStatement('All trade labor, certified punch timestamps, and meal deductions reviewed and authorized for payroll.');
        break;
      case 'inspector':
        setCustomSigTitle('Municipal / Building Code Inspector');
        setCustomSigStatement('Inspected structural framing, fire blocking, and installation per approved architectural plans.');
        break;
      case 'qa':
        setCustomSigTitle('Quality Assurance & Compliance Auditor');
        setCustomSigStatement('Audited against labor standards, verified timecard timestamps, and approved for billing disbursement.');
        break;
      case 'safety':
        setCustomSigTitle('Site Safety & OSHA Compliance Officer');
        setCustomSigStatement('Verified all mandatory safety protocols, tool inspections, and scheduled breaks adhered to on site.');
        break;
      default:
        break;
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const customSigConfig: CustomSignatureConfig | undefined = customSignatureEnabled
        ? {
            enabled: true,
            title: customSigTitle || 'Custom Authorization',
            name: customSigName || '',
            statement: customSigStatement || undefined,
            date: customSigDate || lastWorkingDayDate,
            isManualInk,
          }
        : undefined;

      const doc = generateTimesheetPdf({
        period,
        profile,
        projects,
        entries,
        daysOff,
        includeProjectNotes,
        includedProjectIds: selectedProjectIdsForNotes,
        customSignature: customSigConfig,
      });

      const cleanEmployeeId = (profile.employeeId || 'No-ID').trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
      const fileName = `Timesheet_${cleanEmployeeId}_Period_${period.startDate}_to_${period.endDate}.pdf`;
      if (Capacitor.isNativePlatform()) {
        const dataUri = doc.output('datauristring');
        const commaIndex = dataUri.indexOf(',');
        if (commaIndex < 0) {
          throw new Error('PDF generator returned invalid data.');
        }
        const pdfBase64 = dataUri.slice(commaIndex + 1);
        if (!pdfBase64) {
          throw new Error('PDF generator returned an empty file.');
        }

        // Save directly to the shared Documents/Timesheet folder. Capacitor
        // creates the folder automatically because recursive is enabled.
        const folderPath = `Timesheet/${fileName}`;
        const savedFile = await Filesystem.writeFile({
          path: folderPath,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true,
        });

        const savedInfo = await Filesystem.stat({
          path: folderPath,
          directory: Directory.Documents,
        });
        if (!savedInfo.size || savedInfo.size <= 0) {
          throw new Error('The PDF file was created but appears to be empty.');
        }

        setPdfPreviewUrl(savedFile.uri);
        setDownloadSuccess(true);
      } else {
        const previewUrl = doc.output('bloburl');
        setPdfPreviewUrl(previewUrl);
        doc.save(fileName);
        setDownloadSuccess(true);
      }
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (err) {
      console.error('Error generating or saving PDF:', err);
      const detail = err instanceof Error && err.message ? `\\n\\nDetails: ${err.message}` : '';
      alert(`Could not generate or save the PDF. Please try printing directly.${detail}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0 no-print gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {t.pdfModalTitle || 'Timesheet Audit & Summary'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                #{period.periodNumber} · {period.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Options Toolbar */}
            <button
              type="button"
              onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg border transition-colors shadow-2xs ${
                isOptionsExpanded
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Configure project notes inclusion and custom signature line"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">{t.pdfExportOptionsTitle || 'Export Options'}</span>
              <span className="md:hidden">Options</span>
              {isOptionsExpanded ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printAuditBtn || 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                {isExporting ? 'Generating...' : t.downloadPdfBtn || 'Download PDF'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 no-print animate-in fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              PDF saved to Documents/Timesheet: {`Timesheet_${(profile.employeeId || 'No-ID').trim().replace(/[^a-zA-Z0-9_-]+/g, '_')}_Period_${period.startDate}_to_${period.endDate}.pdf`}
            </span>
            {pdfPreviewUrl && (
              <button
                type="button"
                onClick={async () => {
                  if (Capacitor.isNativePlatform()) {
                    await Share.share({ title: 'Timesheet PDF', url: pdfPreviewUrl, dialogTitle: 'Open timesheet PDF' });
                  } else {
                    window.open(pdfPreviewUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open / Share PDF
              </button>
            )}
          </div>
        )}

        {/* PDF Customization Options Drawer (Hidden in print) */}
        {isOptionsExpanded && (
          <div className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 p-3 sm:p-4.5 no-print shrink-0 max-h-[36vh] overflow-y-auto space-y-3.5 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Option 1: Project Notes Toggle & Specific Selection */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.toggleProjectNotes || 'Include Project & Task Notes'}</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.toggleProjectNotesHelp || 'Display work notes under daily punches in the audit table'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeProjectNotes}
                      onChange={(e) => setIncludeProjectNotes(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Specific Projects Filter Pills */}
                {includeProjectNotes && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Toggle Specific Projects:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllProjects}
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {t.selectAllProjects || 'Select All'}
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllProjects}
                          className="text-[10px] font-semibold text-slate-500 hover:underline"
                        >
                          {t.deselectAllProjects || 'Deselect All'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                      {activePeriodProjects.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          No logged project punches in this 14-day period.
                        </p>
                      ) : (
                        activePeriodProjects.map((p) => {
                          const isSelected = selectedProjectIdsForNotes.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleToggleProject(p.id)}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-semibold'
                                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60 opacity-60'
                              }`}
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: p.color || '#3b82f6' }}
                              />
                              <span className="truncate max-w-[150px]">{p.name}</span>
                              {isSelected ? (
                                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              ) : (
                                <span className="w-3 h-3 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Custom Signature Line */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <PenTool className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.addCustomSignature || 'Add Custom Signature Line'}</span>
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800 font-semibold">
                          Sign-off
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.addCustomSignatureHelp || 'Add 3rd signature block for Client Acceptance, GC sign-off, or Inspector'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSignatureEnabled}
                      onChange={(e) => setCustomSignatureEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Custom Signature Config Fields */}
                {customSignatureEnabled && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    {/* Presets and Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          {t.customSigRoleLabel || 'Role Preset / Template'}
                        </label>
                        <select
                          value={customSigPreset}
                          onChange={(e) => handlePresetChange(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="client">Client / General Contractor</option>
                          <option value="gc">General Contractor Lead</option>
                          <option value="inspector">Municipal / Building Inspector</option>
                          <option value="qa">Quality Assurance / Auditor</option>
                          <option value="safety">Safety Officer / OSHA</option>
                          <option value="custom">Custom Title...</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          Box Header Title
                        </label>
                        <input
                          type="text"
                          value={customSigTitle}
                          onChange={(e) => setCustomSigTitle(e.target.value)}
                          placeholder="e.g. Client Acceptance"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Signee Name & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          {t.customSigNameLabel || 'Signee / Approver Full Name'}
                        </label>
                        <input
                          type="text"
                          value={customSigName}
                          onChange={(e) => setCustomSigName(e.target.value)}
                          placeholder="Leave blank for manual paper ink signature"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          {t.customSigDateLabel || 'Date of Authorization'}
                        </label>
                        <input
                          type="text"
                          value={customSigDate}
                          onChange={(e) => setCustomSigDate(e.target.value)}
                          placeholder="YYYY-MM-DD or leave blank"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Manual Ink vs Digital Signature Option */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="isManualInkCheckbox"
                        checked={isManualInk}
                        onChange={(e) => setIsManualInk(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300"
                      />
                      <label
                        htmlFor="isManualInkCheckbox"
                        className="text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        {t.manualInkSignature || 'Physical Ink Signature Line (X ____________)'}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Printable Document View Container */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="audit-document-printable"
            className="bg-white w-full max-w-[840px] p-4 sm:p-10 border border-slate-200 shadow-md text-slate-900 text-xs font-sans rounded-sm print:border-none print:shadow-none print:p-0 print:max-w-none"
          >
            {/* Document Header */}
            <div className="border-b border-slate-300 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    Biweekly Timesheet & Audit Report
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    14-Day Cycle (10 Standard Working Days) · Verified Punch Log
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono">
                  <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded inline-block">
                    Pay Period #{period.periodNumber}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {period.startDate} to {period.endDate}
                  </p>
                </div>
              </div>

              {/* Personnel, Employer & Audit Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Employee Details</span>
                    {profile.employeeId && (
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                        ID: {profile.employeeId}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Employee Name: {profile.employeeName}
                  </div>
                  <div className="text-slate-600 text-xs font-mono">
                    Employee Email: {profile.employeeEmail || '—'}
                  </div>
                  <div className="text-slate-600 text-xs font-mono">
                    Employee Phone: {profile.employeePhone || '—'}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {profile.title} · {profile.department}
                  </div>
                  <div className="text-xs text-emerald-700 font-bold font-mono">
                    Hourly Rate: {profile.currencySymbol}{profile.defaultHourlyRate ?? 30}/hr
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Client / Employer & Period Summary
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    Client / Employer: {profile.employerName || 'Oakridge Custom Homes'}
                  </div>
                  <div className="text-slate-600 text-xs font-mono">
                    Phone: {profile.employerPhone || '—'}
                  </div>
                  <div className="flex items-baseline gap-2 pt-1 border-t border-slate-200/60">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {totalNetHours.toFixed(2)} Net Hours
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (OT Threshold: {otThreshold}h)
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono">
                    Regular: {regularHours.toFixed(2)}h · Overtime: {overtimeHours.toFixed(2)}h
                    {overtimeHours > 0 && ` (${otMultiplier}x trigger)`}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200/90 rounded-md p-1.5 px-2 my-1 text-[11px] font-mono flex items-baseline justify-between gap-1 flex-wrap">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">Gross Pay:</span>
                    <span className="text-emerald-700 font-black text-xs">
                      {profile.currencySymbol || '$'}{grossPay.toFixed(2)}
                      <span className="text-[10px] text-emerald-600 font-medium ml-1">
                        ({totalNetHours.toFixed(2)}h × {profile.currencySymbol || '$'}{baseRate}/h)
                      </span>
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Meal Breaks Deducted: <span className="font-mono font-semibold">{Math.floor(totalBreakMinutes / 60)} hrs {Math.round(totalBreakMinutes % 60)} min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Detailed Daily Punch Audit Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Daily Time Punch Audit Log
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {includeProjectNotes && (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-200/60">
                      <MessageSquare className="w-3 h-3" />
                      Notes Active ({selectedProjectIdsForNotes.length} projects)
                    </span>
                  )}
                  <span>All punches recorded with meal break deductions</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Project / Code</th>
                      <th className="py-2 px-3">Client</th>
                      <th className="py-2 px-2 text-center">In (Punch)</th>
                      <th className="py-2 px-2 text-center">Out (Punch)</th>
                      <th className="py-2 px-2 text-center">Meal Break</th>
                      <th className="py-2 px-3 text-right">Net Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodDays.map((day) => {
                      const dayEntries = periodEntries.filter((e) => e.date === day.date);
                      const dayOff = dayOffMap.get(day.date);

                      if (dayEntries.length === 0) {
                        return (
                          <tr
                            key={day.date}
                            className={`text-slate-400 ${
                              dayOff
                                ? (dayOff.isDidNotWork || dayOff.reason === "Didn't work"
                                    ? 'bg-rose-50/50'
                                    : 'bg-amber-50/50')
                                : 'bg-white hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="py-1.5 px-3 font-medium whitespace-nowrap">
                              {day.formattedDate} ({day.dayName})
                            </td>
                            <td colSpan={5} className="py-1.5 px-3 text-[11px]">
                              {dayOff ? (
                                dayOff.isDidNotWork || dayOff.reason === "Didn't work" ? (
                                  <span className="inline-flex items-center gap-1.5 text-rose-900 font-semibold">
                                    <span>🚫</span>
                                    <span>Didn't Work: {dayOff.notes || dayOff.reason || 'Unworked Day'}</span>
                                    {dayOff.isPaid && (
                                      <span className="text-[10px] bg-rose-200 text-rose-950 px-1 rounded uppercase font-bold">
                                        Paid
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-amber-900 font-semibold">
                                    <span>🌴</span>
                                    <span>Day Off: {dayOff.reason || 'Scheduled Day Off'}</span>
                                    {dayOff.isPaid && (
                                      <span className="text-[10px] bg-amber-200 text-amber-950 px-1 rounded uppercase font-bold">
                                        Paid
                                      </span>
                                    )}
                                  </span>
                                )
                              ) : day.isWeekend ? (
                                <span className="italic text-slate-400">Weekend — Off duty</span>
                              ) : (
                                <span className="italic text-slate-400">Scheduled off / No punches</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-400">0.00</td>
                          </tr>
                        );
                      }

                      return dayEntries.map((entry, idx) => {
                        const proj = projectMap.get(entry.projectId);
                        const isNotesIncludedForEntry =
                          includeProjectNotes && selectedProjectIdsForNotes.includes(entry.projectId);
                        const entryNoteText = entry.notes || proj?.description || '';

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50 text-slate-800">
                            <td className="py-2 px-3 font-medium whitespace-nowrap">
                              {idx === 0 ? `${day.formattedDate} (${day.dayName})` : ''}
                            </td>
                            <td className="py-2 px-3 font-medium">
                              <div>
                                <span>{proj?.name || 'Project'}</span>
                                {proj?.code && !proj?.name?.includes(proj.code) && (
                                  <span className="text-[10px] font-mono text-slate-500 ml-1">
                                    [{proj.code}]
                                  </span>
                                )}
                              </div>
                              {/* Display project/work note subline when toggled */}
                              {isNotesIncludedForEntry && entryNoteText && (
                                <div className="text-[10px] text-slate-600 italic mt-0.5 flex items-start gap-1 font-sans bg-blue-50/60 p-1 rounded border border-blue-100">
                                  <span className="text-blue-600 font-semibold not-italic shrink-0">↳ Note:</span>
                                  <span className="text-slate-700">{entryNoteText}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {proj?.client || '—'}
                            </td>
                            <td className="py-2 px-2 text-center font-mono tabular-nums whitespace-nowrap">
                              {formatTime12h(entry.startTime)}
                            </td>
                            <td className="py-2 px-2 text-center font-mono tabular-nums whitespace-nowrap">
                              {formatTime12h(entry.endTime)}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-mono whitespace-nowrap">
                              {(() => {
                                const effBreak = getEffectiveBreakMinutes(entry);
                                const isZeroWorkDay = unworkedDaySet.has(entry.date) || (dailyWorkedHoursMap.get(entry.date) || 0) <= 0;
                                if (isZeroWorkDay) {
                                  return (
                                    <span className="text-slate-400 font-sans text-xs" title="0.00 hrs worked — meal break not counted">
                                      —
                                    </span>
                                  );
                                }
                                return `${Math.floor(effBreak / 60)}h ${effBreak % 60}m`;
                              })()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                              {unworkedDaySet.has(entry.date) ? (
                                <span className="text-slate-400 line-through" title="Unworked Day: 0.00 hrs">0.00</span>
                              ) : entry.netHours === 0 ? (
                                <span className="text-slate-400">0.00</span>
                              ) : (
                                entry.netHours.toFixed(2)
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })}

                    {/* Table Totals Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={6} className="py-2.5 px-3">
                        {t.periodAuditTotal || 'PERIOD AUDIT TOTAL:'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm">
                        {totalNetHours.toFixed(2)} hrs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Compliance & Formal Signatures */}
            <div className="pt-6 mt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. COMPLIANCE & SIGN-OFF VERIFICATION
                </h2>
                {customSignatureEnabled && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>3-Party Certified Audit</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                I hereby certify that this timesheet accurately reflects all hours worked, start/end timestamps, and unpaid meal breaks during this 14-day biweekly period.
              </p>

              <div className={`grid gap-4 pt-2 ${customSignatureEnabled ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {/* Employee Signature Box */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Employee Certification
                  </div>
                  <div className="pt-4 border-b border-dashed border-slate-400 min-h-[38px] flex items-end">
                    <span className="font-serif italic text-base text-slate-800">
                      {profile.employeeName}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Verified: {profile.employeeName}</span>
                    <span>Date: {lastWorkingDayDate}</span>
                  </div>
                </div>

                {/* Supervisor Approval Box */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Supervisor Authorization
                  </div>
                  <div className="pt-4 border-b border-dashed border-slate-400 min-h-[38px] flex items-end">
                    <span className="font-serif italic text-base text-slate-800">
                      {profile.supervisorName}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span className="text-emerald-700 font-bold">STATUS: APPROVED</span>
                    <span>Date: {lastWorkingDayDate}</span>
                  </div>
                </div>

                {/* Custom Signature Line Box (Shown when enabled) */}
                {customSignatureEnabled && (
                  <div className="border border-blue-200 bg-blue-50/20 rounded-lg p-3.5 space-y-3">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-700 flex items-center justify-between">
                      <span className="truncate">{customSigTitle || 'Custom Sign-off'}</span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold uppercase">
                        Authorized
                      </span>
                    </div>

                    <div className="pt-4 border-b border-dashed border-blue-300 min-h-[38px] flex items-end">
                      {isManualInk ? (
                        <div className="w-full flex items-center text-xs text-slate-400 font-mono pb-1">
                          <span className="font-bold text-slate-700 mr-3 text-sm">X</span>
                          <span className="border-b-2 border-slate-400 flex-1 ml-1"></span>
                        </div>
                      ) : (
                        <span className="font-serif italic text-base text-slate-800">
                          {customSigName || 'Authorized Signatory'}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1">
                      <span className="text-blue-700 font-semibold truncate max-w-[160px]">
                        {customSigName ? `Signee:  ${customSigName}` : (isManualInk ? 'Manual Ink Signature' : 'Authorized Sign')}
                      </span>
                      <span className="shrink-0">Date: {customSigDate || lastWorkingDayDate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Statement Note if Provided */}
              {customSignatureEnabled && customSigStatement && (
                <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-600 italic">
                  <strong className="text-slate-800 not-italic">Sign-off Compliance Statement:</strong> "{customSigStatement}"
                </div>
              )}

              {/* Audit Stamp */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                Chronos Audit Engine v2.4 · Biweekly Schedule #{period.periodNumber} ({period.startDate} to {period.endDate}) · Generated {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
