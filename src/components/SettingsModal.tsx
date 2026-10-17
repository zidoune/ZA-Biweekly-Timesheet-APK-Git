import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  X,
  User,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Check,
  Clock,
  FileSpreadsheet,
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { TimesheetProfile } from '../types/timesheet';
import { INITIAL_ENTRIES, INITIAL_PROJECTS, INITIAL_PROFILE } from '../utils/storage';
import { convertAllDataJsonToCsv, downloadAllDataCsv } from '../utils/csvExport';
import { useLanguage } from '../context/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TimesheetProfile;
  onSaveProfile: (profile: TimesheetProfile) => void;
  onResetData: () => void;
  allDataJson: string;
  onImportData: (jsonStr: string) => void;
  onUpdateClientName?: (newClient: string) => void;
  onOpenEnterForAnother?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
  allDataJson,
  onImportData,
  onUpdateClientName,
  onOpenEnterForAnother,
}) => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<TimesheetProfile>(profile);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const hasContractorPermissions = Boolean(
    formData.contractorPermissions ??
    (formData.isContractor ||
     formData.role === 'contractor' ||
     formData.role === 'admin' ||
     formData.title?.toLowerCase().includes('contractor') ||
     formData.title?.toLowerCase().includes('superintendent') ||
     formData.title?.toLowerCase().includes('project lead') ||
     formData.title?.toLowerCase().includes('manager') ||
     formData.title?.toLowerCase().includes('foreman') ||
     formData.supervisorName?.toLowerCase().includes('contractor'))
  );

  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    if (onUpdateClientName && formData.employerName && formData.employerName !== profile.employerName) {
      onUpdateClientName(formData.employerName);
    }
    onClose();
  };

  const handleExportData = async () => {
    try {
      const parsed = JSON.parse(allDataJson);
      // Full current state: entries, projects, profile, daysOff
      const exportPayload = {
        profile: { ...parsed.profile, ...formData },
        projects: parsed.projects || [],
        entries: parsed.entries || [],
        daysOff: parsed.daysOff || [],
        managedEmployees: parsed.managedEmployees || [],
        activeEmployeeId: parsed.activeEmployeeId ?? null,
        exportedAt: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(exportPayload, null, 2);
      const cleanName = (formData.employeeName || profile.employeeName || 'timesheet')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `timesheet_data_${cleanName}_${dateStr}.json`;
      if (Capacitor.isNativePlatform()) {
        // Create a real file, then let Android's share sheet save it to Files/Drive/email.
        const base64 = btoa(unescape(encodeURIComponent(jsonString)));
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: 'ZA Biweekly Timesheet Backup',
          text: 'Save this backup file somewhere safe. Use Import JSON to restore it later.',
          url: saved.uri,
          dialogTitle: 'Save or share timesheet backup',
        });
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setImportStatus(
        language === 'fr'
          ? 'Données exportées avec succès (JSON) !'
          : 'Data exported successfully (JSON)!'
      );
      setTimeout(() => setImportStatus(null), 3500);
    } catch (err) {
      console.error('Error exporting data:', err);
      const blob = new Blob([allDataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRestoreAutoBackup = () => {
    try {
      const raw = localStorage.getItem('za_timesheet_auto_backup_v1');
      if (!raw) {
        setImportStatus(language === 'fr' ? 'Aucune sauvegarde automatique trouvée.' : 'No automatic backup found on this device.');
        return;
      }
      if (!window.confirm(language === 'fr' ? 'Restaurer la dernière sauvegarde automatique ? Les données actuelles seront remplacées.' : 'Restore the latest automatic backup? Current data will be replaced.')) return;
      onImportData(raw);
      setImportStatus(language === 'fr' ? 'Sauvegarde automatique restaurée.' : 'Automatic backup restored successfully.');
      setTimeout(() => setImportStatus(null), 3500);
    } catch (err) {
      console.error('Error restoring automatic backup:', err);
      setImportStatus(language === 'fr' ? 'Échec de la restauration.' : 'Failed to restore automatic backup.');
    }
  };

  const handleDownloadCsv = async () => {
    try {
      // Build the export from the latest app data and the profile currently shown
      // in Settings, so recently edited profile fields are not left stale in CSV.
      const parsed = JSON.parse(allDataJson);
      const exportPayload = {
        ...parsed,
        profile: { ...(parsed.profile || {}), ...formData },
        exportedAt: new Date().toISOString(),
      };
      const csvContent = convertAllDataJsonToCsv(JSON.stringify(exportPayload));
      const cleanName = (formData.employeeName || profile.employeeName || 'timesheet')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `za_timesheet_data_${cleanName}_${dateStr}.csv`;
      // UTF-8 BOM helps Excel display names and notes correctly.
      const csvWithBom = '\uFEFF' + csvContent;

      if (Capacitor.isNativePlatform()) {
        // Android WebView downloads from Blob URLs are unreliable; create a real
        // cache file and use the native share sheet to save/share the CSV.
        const base64 = btoa(unescape(encodeURIComponent(csvWithBom)));
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: 'ZA Biweekly Timesheet CSV Export',
          text: 'Export of timesheet entries, days off, projects, profile settings, and audit totals.',
          url: saved.uri,
          dialogTitle: 'Save or share CSV export',
        });
      } else {
        downloadAllDataCsv(JSON.stringify(exportPayload), formData.employeeName || profile.employeeName);
      }

      setImportStatus(
        language === 'fr'
          ? 'Exportation CSV prête à enregistrer ou partager !'
          : 'CSV export ready to save or share!'
      );
      setTimeout(() => setImportStatus(null), 3500);
    } catch (err) {
      console.error('Error generating CSV export:', err);
      setImportStatus(
        language === 'fr'
          ? "Échec de l'exportation CSV"
          : 'Failed to generate CSV export. Please try again.'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);
        if (!backup || typeof backup !== 'object' || !backup.profile || !Array.isArray(backup.projects) || !Array.isArray(backup.entries) || !Array.isArray(backup.daysOff)) {
          throw new Error('Invalid backup format');
        }
        if (!window.confirm(language === 'fr' ? 'Importer cette sauvegarde remplacera les données actuelles. Continuer ?' : 'Restoring this backup will replace your current timesheet data. Continue?')) return;
        onImportData(text);
        setImportStatus(language === 'fr' ? 'Sauvegarde restaurée avec succès !' : 'Backup successfully restored!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Profile & Timesheet Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Employee Profile Fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Signature & Personnel Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeName}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeName: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Employee Phone
                </label>
                <input
                  type="tel"
                  value={formData.employeePhone}
                  onChange={(e) =>
                    setFormData({ ...formData, employeePhone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Client / Employer Name
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Client
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) =>
                    setFormData({ ...formData, employerName: e.target.value })
                  }
                  placeholder="e.g. Oakridge Custom Homes"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Primary client (e.g. Oakridge Custom Homes). Updates associated projects on save.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Client / Employer Phone
                </label>
                <input
                  type="tel"
                  value={formData.employerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, employerPhone: e.target.value })
                  }
                  placeholder="(555) 890-1234"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Employee ID
                  </label>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                    Unique ID
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.employeeId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employeeId: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. EMP-001"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Each added Employee will have a unique ID.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Employee Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.employeeEmail || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employeeEmail: e.target.value,
                    })
                  }
                  placeholder="employee@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Contact address for digital pay stubs.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Supervisor / Approver Name
                </label>
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorName: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contractor Permissions Control */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.contractorPermissions ?? true)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractorPermissions: e.target.checked,
                        isContractor: e.target.checked,
                        role: e.target.checked ? 'contractor' : 'employee',
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Contractor Permissions
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Enables timesheet entry for other crew members
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Schedule & Deductions */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Workday & Meal Break Defaults
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Days
                </label>
                <input
                  type="number"
                  min="5"
                  max="14"
                  value={formData.targetWorkingDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetWorkingDays: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Std: 10 days</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Daily Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  value={formData.dailyStandardHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyStandardHours: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Std: 8.0 hrs</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Default Meal Break
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.defaultBreakMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultBreakMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                  {Math.floor(formData.defaultBreakMinutes / 60)} hrs {formData.defaultBreakMinutes % 60} min
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Base Rate ({formData.currencySymbol}/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.defaultHourlyRate ?? 30}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultHourlyRate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Hourly rate</span>
              </div>
            </div>
          </div>

          {/* Overtime Policy & Calculation Setting */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.overtimeThresholdLabel}</span>
              </h3>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                {language === 'fr' ? '14 jours / Bimensuel' : '14-Day Biweekly Policy'}
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Overtime Threshold */}
                <div>
                  <label htmlFor="overtimeThresholdInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.overtimeThresholdLabel} ({language === 'fr' ? 'heures' : 'hrs'})
                  </label>
                  <div className="relative">
                    <input
                      id="overtimeThresholdInput"
                      type="number"
                      step="0.5"
                      min="0"
                      max="140"
                      value={formData.overtimeThreshold ?? 80}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeThreshold: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium pointer-events-none">
                      {language === 'fr' ? 'h' : 'hrs'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {t.overtimeThresholdHelp}
                  </p>
                </div>

                {/* Overtime Pay Rate Multiplier */}
                <div>
                  <label htmlFor="overtimeMultiplierInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.overtimeMultiplierLabel}
                  </label>
                  <select
                    id="overtimeMultiplierInput"
                    value={formData.overtimeRateMultiplier ?? 1.5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtimeRateMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1.5">1.5x — {language === 'fr' ? 'Taux et demi (Standard)' : 'Time & a half (1.5x)'}</option>
                    <option value="2.0">2.0x — {language === 'fr' ? 'Taux double (2.0x)' : 'Double time (2.0x)'}</option>
                    <option value="1.25">1.25x — {language === 'fr' ? 'Taux majoré (+25%)' : '+25% Overtime rate (1.25x)'}</option>
                    <option value="1.0">1.0x — {language === 'fr' ? 'Taux simple (1.0x)' : 'Straight time / 1.0x'}</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {t.overtimeMultiplierHelp}
                  </p>
                </div>
              </div>

              {/* Dynamic Calculation Info Pill */}
              <div className="bg-white border border-slate-200/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
                <span className="text-slate-500">
                  {language === 'fr' ? 'Taux heures supplémentaires :' : 'Effective Overtime Rate:'}
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {formData.currencySymbol || '$'}
                  {((formData.defaultHourlyRate ?? 30) * (formData.overtimeRateMultiplier ?? 1.5)).toFixed(2)}/hr
                  <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                    ({formData.overtimeRateMultiplier ?? 1.5}x × {formData.currencySymbol || '$'}{formData.defaultHourlyRate ?? 30}/hr after {formData.overtimeThreshold ?? 80} hrs)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Management & Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Automatic on-device backup updates whenever your profile, projects, or timesheet entries change. Export a JSON backup regularly to keep a copy outside your phone.</p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
                title={language === 'fr' ? 'Télécharger l’état complet (entrées, projets, profil, congés) au format JSON' : 'Download current full state (entries, projects, profile, daysOff) as JSON'}
                aria-label="Export Data"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Data</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreAutoBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg shadow-2xs transition-colors"
                title="Restore the most recent automatic on-device backup"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Auto Backup</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
                title={language === 'fr' ? 'Exporter toutes les données en feuille de calcul CSV' : 'Export all data as CSV spreadsheet'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'fr' ? 'Exporter CSV' : 'Export CSV'}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onResetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {importStatus}
              </p>
            )}
          </div>

          {/* Contractor Timesheet Delegation: ONLY displayed to users with appropriate contractor permissions */}
          {hasContractorPermissions && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Contractor Timesheet Delegation</span>
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Contractor Permission: Active</span>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Enter Timesheet for Another Employee
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select an employee or register a new crew member with a unique Employee ID to log hours and punches on their behalf.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEnterForAnother) {
                      onOpenEnterForAnother();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs hover:shadow-sm active:scale-98 transition-all shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>Enter Timesheet for Another Employee</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
