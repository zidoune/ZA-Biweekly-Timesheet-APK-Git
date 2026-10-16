import React from 'react';
import { User, Phone, Building2, PhoneCall, DollarSign } from 'lucide-react';
import { TimesheetProfile } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';

interface SheetPersonnelHeaderProps {
  profile: TimesheetProfile;
  onUpdateProfile: (updated: TimesheetProfile) => void;
  onUpdateHourlyRate?: (rate: number) => void;
  onUpdateClientName?: (newClient: string) => void;
}

export const SheetPersonnelHeader: React.FC<SheetPersonnelHeaderProps> = ({
  profile,
  onUpdateProfile,
  onUpdateHourlyRate,
  onUpdateClientName,
}) => {
  const { t } = useLanguage();

  const handleChange = (field: keyof TimesheetProfile, value: any) => {
    onUpdateProfile({
      ...profile,
      [field]: value,
    });
  };

  const handleClientChange = (clientVal: string) => {
    handleChange('employerName', clientVal);
    if (onUpdateClientName) {
      onUpdateClientName(clientVal);
    }
  };

  const handleRateChange = (rateVal: number) => {
    handleChange('defaultHourlyRate', rateVal);
    if (onUpdateHourlyRate) {
      onUpdateHourlyRate(rateVal);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs transition-colors duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Field 1: Employee Name & Unique Employee ID: */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{t.employeeName}</span>
            </label>
            {profile.employeeId && (
              <span
                className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800"
                title={`Unique Employee ID: ${profile.employeeId}`}
              >
                ID: {profile.employeeId}
              </span>
            )}
          </div>
          <input
            type="text"
            value={profile.employeeName}
            onChange={(e) => handleChange('employeeName', e.target.value)}
            placeholder="e.g. Zied Ammar"
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Field 2: Employee Phone: */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{t.employeePhone}</span>
          </label>
          <input
            type="tel"
            value={profile.employeePhone}
            onChange={(e) => handleChange('employeePhone', e.target.value)}
            placeholder="e.g. (555) 234-5678"
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Field 3: Client / Employer Name (Oakridge Custom Homes): */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.employerName}</span>
            </label>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/60 hidden xl:inline-block">
              Client
            </span>
          </div>
          <input
            type="text"
            value={profile.employerName}
            onChange={(e) => handleClientChange(e.target.value)}
            placeholder="e.g. Oakridge Custom Homes"
            title="Client / Employer Name (updates active timesheet client)"
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Field 4: Client / Employer Phone: */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t.employerPhone}</span>
          </label>
          <input
            type="tel"
            value={profile.employerPhone}
            onChange={(e) => handleChange('employerPhone', e.target.value)}
            placeholder="e.g. (555) 890-1234"
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Field 5: Hourly Rate: Editable */}
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.baseHourlyRate}</span>
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold pointer-events-none">
              {profile.currencySymbol || '$'}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={profile.defaultHourlyRate ?? 30}
              onChange={(e) => handleRateChange(Number(e.target.value))}
              placeholder="30"
              className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-6 pr-9 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
              /hr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
