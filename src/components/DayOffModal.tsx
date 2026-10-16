import React, { useState, useEffect } from 'react';
import { X, Palmtree, CheckCircle2, Trash2, Ban, Clock, AlertCircle } from 'lucide-react';
import { DayOff } from '../types/timesheet';
import { formatFullDay, toISODateString } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface DayOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateISO: string;
  existingDayOff?: DayOff;
  initialMode?: 'day_off' | 'did_not_work';
  onSaveDayOff: (dayOff: DayOff) => void;
  onRemoveDayOff: (dateISO: string) => void;
}

const PRESET_DAY_OFF_REASONS = [
  { label: 'Scheduled Day Off', icon: '🌴' },
  { label: 'Paid Time Off (PTO)', icon: '🏖️' },
  { label: 'Public Holiday', icon: '🏛️' },
  { label: 'Sick Leave', icon: '🤒' },
  { label: 'Personal Day', icon: '🏡' },
  { label: 'Weather / Site Standdown', icon: '🌧️' },
  { label: 'Unpaid Leave', icon: '⏸️' },
];

const PRESET_DID_NOT_WORK_REASONS = [
  { label: "Didn't work", icon: '🚫' },
  { label: 'No Show / Absent', icon: '❌' },
  { label: 'Inclement Weather', icon: '🌧️' },
  { label: 'Job Site Standdown', icon: '🚧' },
  { label: 'No Work Scheduled', icon: '⏸️' },
  { label: 'Unexcused Absence', icon: '⚠️' },
];

export const DayOffModal: React.FC<DayOffModalProps> = ({
  isOpen,
  onClose,
  dateISO,
  existingDayOff,
  initialMode = 'day_off',
  onSaveDayOff,
  onRemoveDayOff,
}) => {
  const { t, language, dateLocale } = useLanguage();
  const todayISO = toISODateString(new Date());
  const isCurrentDate = dateISO === todayISO;

  const [isDidNotWork, setIsDidNotWork] = useState(false);
  const [reason, setReason] = useState('Scheduled Day Off');
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingDayOff) {
      const wasDidNotWork = Boolean(
        existingDayOff.isDidNotWork || existingDayOff.reason === "Didn't work"
      );
      setIsDidNotWork(wasDidNotWork);
      setReason(existingDayOff.reason || (wasDidNotWork ? "Didn't work" : 'Scheduled Day Off'));
      setIsPaid(Boolean(existingDayOff.isPaid));
      setNotes(existingDayOff.notes || '');
    } else {
      if (initialMode === 'did_not_work' && !isCurrentDate) {
        setIsDidNotWork(true);
        setReason("Didn't work");
        setIsPaid(false);
        setNotes('');
      } else {
        setIsDidNotWork(false);
        setReason('Scheduled Day Off');
        setIsPaid(false);
        setNotes('');
      }
    }
  }, [existingDayOff, isOpen, initialMode, isCurrentDate]);

  if (!isOpen || !dateISO) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDayOff({
      date: dateISO,
      reason: reason.trim() || (isDidNotWork ? "Didn't work" : 'Scheduled Day Off'),
      isPaid,
      notes: notes.trim() || undefined,
      isDidNotWork,
    });
    onClose();
  };

  const handleRemove = () => {
    onRemoveDayOff(dateISO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0 transition-colors ${
            isDidNotWork ? 'bg-rose-50/60' : 'bg-amber-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                isDidNotWork
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isDidNotWork ? <Ban className="w-4 h-4" /> : <Palmtree className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {existingDayOff
                  ? isDidNotWork
                    ? (language === 'fr' ? 'Modifier "Non travaillé"' : 'Edit "Didn\'t Work" Status')
                    : (language === 'fr' ? 'Modifier le jour de repos' : 'Edit Day Off Settings')
                  : (language === 'fr' ? 'Marquer comme jour de repos' : 'Make Working Day as Day Off')}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                {formatFullDay(dateISO, dateLocale)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Option selector: Under Make Working Day as Day Off, option to mark the day as didn't work if not current date */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                {t.dayStatusLabel}
              </label>
              {!isCurrentDate ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                  {language === 'fr' ? 'Date passée / future' : 'Past / Future date'}
                </span>
              ) : (
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                  {language === 'fr' ? "Date du jour (Aujourd'hui)" : 'Current date (Today)'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsDidNotWork(false);
                  if (reason === "Didn't work" || reason === 'No Show / Absent') {
                    setReason(language === 'fr' ? 'Jour de repos' : 'Scheduled Day Off');
                  }
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  !isDidNotWork
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palmtree className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.statusDayOffLeave}</span>
              </button>

              <button
                type="button"
                disabled={isCurrentDate}
                onClick={() => {
                  if (!isCurrentDate) {
                    setIsDidNotWork(true);
                    setReason("Didn't work");
                    setIsPaid(false);
                  }
                }}
                title={
                  isCurrentDate
                    ? (language === 'fr'
                      ? 'Non disponible pour la date du jour en cours'
                      : 'Marking as "Didn\'t work" is not available for the current date')
                    : (language === 'fr'
                      ? "Marquer que l'employé n'a pas travaillé ce jour-là"
                      : "Mark that employee didn't work on this day")
                }
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  isCurrentDate
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-transparent'
                    : isDidNotWork
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{t.statusDidNotWork}</span>
              </button>
            </div>

            {isCurrentDate ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {language === 'fr' ? (
                    <>
                      L'option pour marquer comme <strong>N'a pas travaillé</strong> est uniquement activée pour les dates autres qu'aujourd'hui.
                    </>
                  ) : (
                    <>
                      Option to mark as <strong>Didn't work</strong> is only enabled for dates other than today (current date).
                    </>
                  )}
                </span>
              </div>
            ) : isDidNotWork ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{t.statusDidNotWork} :</span>
                  <span className="text-rose-800 ml-1">
                    {language === 'fr'
                      ? "L'employé n'a pas travaillé à cette date (0.00 heure enregistrée)."
                      : 'Employee did not work on this date (0.00 hours recorded).'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {isDidNotWork ? 'Select Unworked Reason' : 'Select Reason / Classification'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(isDidNotWork ? PRESET_DID_NOT_WORK_REASONS : PRESET_DAY_OFF_REASONS).map((preset) => {
                const isSelected = reason === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setReason(preset.label);
                      if (preset.label.includes('PTO') || preset.label.includes('Holiday')) {
                        setIsPaid(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                      isSelected
                        ? isDidNotWork
                          ? 'bg-rose-500/10 border-rose-500 text-rose-900 shadow-xs'
                          : 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Reason Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Reason or Label
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isDidNotWork ? "e.g. Didn't work, Absent, Job Site Shutdown" : "e.g. Scheduled Day Off, Doctor Appointment, etc."}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Paid / Unpaid Checkbox */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="block text-xs font-semibold text-slate-800">
                {isDidNotWork ? 'Paid Absence / Standdown' : 'Paid Time Off (PTO / Holiday)'}
              </span>
              <span className="block text-[11px] text-slate-500">
                {isDidNotWork
                  ? 'Mark whether the employer pays for this unworked date'
                  : 'Mark whether this day off is paid by employer'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isDidNotWork
                  ? 'Optional note why work was not performed on this date...'
                  : 'Optional notes for payroll or compliance record...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            {existingDayOff ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.removeDayOffBtn}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                  isDidNotWork
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isDidNotWork
                    ? (language === 'fr' ? 'Enregistrer comme non travaillé' : "Save as Didn't Work")
                    : (language === 'fr' ? 'Enregistrer comme jour de repos' : 'Save as Day Off')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
