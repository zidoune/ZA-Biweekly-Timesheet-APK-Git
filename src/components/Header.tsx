import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Briefcase,
  Settings,
} from 'lucide-react';
import { BiweeklyPeriod } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  periods: BiweeklyPeriod[];
  currentPeriod: BiweeklyPeriod;
  onSelectPeriod: (period: BiweeklyPeriod) => void;
  onOpenPdfModal: () => void;
  onOpenProjectsModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  periods,
  currentPeriod,
  onSelectPeriod,
  onOpenPdfModal,
  onOpenProjectsModal,
  onOpenSettingsModal,
}) => {
  const { t } = useLanguage();
  const currentIndex = periods.findIndex((p) => p.id === currentPeriod.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < periods.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectPeriod(periods[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectPeriod(periods[currentIndex + 1]);
  };

  return (
    <header className="app-safe-header bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-stretch gap-2 py-2 lg:flex-row lg:items-center lg:justify-between lg:py-0 lg:min-h-16">
          {/* Brand icon and “Chronos” wordmark removed; keep header actions aligned. */}
          <div className="flex-1 min-w-0" aria-hidden="true" />

          {/* Zone 2: Pay Period Navigator & Period Selector (Desktop Center View) */}
          <div className="hidden md:flex items-center justify-center gap-2 lg:justify-start">
            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title={t.previousPeriod}
                aria-label={t.previousPeriod}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 flex items-center gap-2 text-xs font-medium text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-900">{t.periodNumber}{currentPeriod.periodNumber}:</span>
                <span className="whitespace-nowrap font-mono">{currentPeriod.label}</span>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title={t.nextPeriod}
                aria-label={t.nextPeriod}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>


          </div>

          {/* Zone 3: Actions (Projects, Settings, Export PDF, Theme, and Language Selector) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0 lg:justify-end">
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t.projectsBtn}
              aria-label={t.projectsBtn}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">{t.projectsBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t.settingsBtn}
              aria-label={t.settingsBtn}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">{t.settingsBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs transition-colors shrink-0"
              title={t.exportPdfBtn}
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t.exportPdfBtn}</span>
              <span className="sm:hidden text-[11px]">PDF</span>
            </button>

            {/* Theme switcher toggle */}
            <ThemeSwitcher />

            {/* Separator before language selector */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Language selector in top-right corner */}
            <LanguageSelector />
          </div>
        </div>

        {/* Zone 2: Mobile Dedicated Pay Period Navigator Bar */}
        <div className="md:hidden pb-2.5 pt-0.5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5">
          <div className="inline-flex items-center justify-between w-full max-w-sm bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl p-1.5 shadow-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title={t.previousPeriod}
              aria-label={t.previousPeriod}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0 px-2 py-1 flex items-center justify-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
              <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="font-bold text-blue-800 dark:text-blue-300 whitespace-nowrap">#{currentPeriod.periodNumber}</span>
              <span className="font-mono whitespace-normal leading-tight">{currentPeriod.label}</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title={t.nextPeriod}
              aria-label={t.nextPeriod}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>


        </div>
      </div>
    </header>
  );
};
