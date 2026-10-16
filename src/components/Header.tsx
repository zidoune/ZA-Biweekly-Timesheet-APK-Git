import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Briefcase,
  Settings,
  Clock,
  TrendingUp,
  LogOut,
  Cloud,
  Smartphone,
} from 'lucide-react';
import { BiweeklyPeriod, TimesheetProfile } from '../types/timesheet';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  periods: BiweeklyPeriod[];
  currentPeriod: BiweeklyPeriod;
  onSelectPeriod: (period: BiweeklyPeriod) => void;
  profile: TimesheetProfile;
  totalPeriodHours?: number;
  onOpenPdfModal: () => void;
  onOpenProjectsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenApkModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  periods,
  currentPeriod,
  onSelectPeriod,
  profile,
  totalPeriodHours = 0,
  onOpenPdfModal,
  onOpenProjectsModal,
  onOpenSettingsModal,
  onOpenApkModal,
}) => {
  const { t } = useLanguage();
  const { user, signInWithGoogle, signOutUser, loading: authLoading } = useAuth();
  const standard80Threshold = 80.0;
  const isOvertime = totalPeriodHours > standard80Threshold;
  const overtimeHours = Math.max(0, totalPeriodHours - standard80Threshold);
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
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          {/* Zone 1: Wordmark & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              {isOvertime && (
                <span
                  className="absolute -top-1 -right-1 flex h-3 w-3"
                  title={`${t.headerOvertimeBadge}: ${totalPeriodHours.toFixed(1)}h (>80h threshold)`}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap">
                  {t.appTitle}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 tracking-wide uppercase hidden min-[420px]:inline-block">
                  {t.appSubtitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
                {t.cycleInfo}
              </p>
            </div>
          </div>

          {/* Zone 2: Pay Period Navigator & Period Selector (Desktop Center View) */}
          <div className="hidden md:flex items-center gap-2">
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

            {/* Overtime Notification Badge (> 80h Threshold) */}
            {isOvertime && (
              <div
                className="relative group/ot inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300/90 text-amber-900 text-xs font-semibold shadow-2xs hover:bg-amber-100 transition-all cursor-help select-none"
                role="status"
                aria-label={`${t.headerOvertimeBadge}: ${totalPeriodHours.toFixed(1)}h logged (${overtimeHours.toFixed(1)}h over 80h threshold)`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold whitespace-nowrap">{t.headerOvertimeBadge}</span>
                <span className="bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight">
                  +{overtimeHours.toFixed(1)}h OT
                </span>

                {/* Overtime Info Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 p-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md opacity-0 group-hover/ot:opacity-100 group-hover/ot:scale-100 pointer-events-none group-hover/ot:pointer-events-auto transition-all duration-150 text-left">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-700/80" />
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      {t.headerOvertimeThresholdExceeded}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      &gt; 80h Limit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug mb-2 font-sans">
                    {t.headerOvertimeNotice}
                  </p>
                  <div className="space-y-1 font-mono text-[11px] bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400 font-sans">Logged:</span>
                      <span className="font-bold text-white">{totalPeriodHours.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400 font-sans">Threshold:</span>
                      <span>80.00h</span>
                    </div>
                    <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-700">
                      <span className="text-amber-300 font-sans font-semibold">Overtime:</span>
                      <span className="font-bold">+{overtimeHours.toFixed(2)}h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zone 3: Actions (Projects, Settings, Export PDF, Theme, and Language Selector) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenProjectsModal}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t.projectsBtn}
              aria-label={t.projectsBtn}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden lg:inline">{t.projectsBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t.settingsBtn}
              aria-label={t.settingsBtn}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden lg:inline">{profile.employeeName.split(' ')[0] || t.settingsBtn}</span>
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

            <button
              type="button"
              onClick={onOpenApkModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white rounded-lg shadow-2xs transition-colors shrink-0"
              title={t.mobileAppBtn}
              aria-label={t.mobileAppBtn}
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t.mobileAppBtn}</span>
              <span className="sm:hidden text-[11px]">APK</span>
            </button>

            {/* Separator before Auth, Theme, and Language controls */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Firebase Auth & Cloud Sync Control */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Cloud Sync Status Indicator */}
                <div
                  className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300"
                  title={t.cloudSyncNotice}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{t.firestoreConnected}</span>
                </div>

                {/* User Profile Chip */}
                <div
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                  title={`${t.signedInAs}: ${user.displayName || user.email}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-600 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold max-w-[80px] sm:max-w-[100px] truncate hidden min-[480px]:inline">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors ml-0.5"
                    title={t.signOut}
                    aria-label={t.signOut}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={authLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg shadow-2xs transition-all shrink-0"
                title={t.signInWithGoogle}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">{t.signInWithGoogle}</span>
                <span className="sm:hidden text-[11px]">Sign in</span>
              </button>
            )}

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
          <div className="inline-flex items-center justify-between w-full max-w-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title={t.previousPeriod}
              aria-label={t.previousPeriod}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2 py-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 text-center truncate">
              <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white">#{currentPeriod.periodNumber}:</span>
              <span className="font-mono truncate">{currentPeriod.label}</span>
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

          {/* Mobile Overtime Visual Indicator Banner */}
          {isOvertime && (
            <div className="flex items-center justify-between w-full max-w-sm px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/90 dark:border-amber-700 rounded-lg text-[11px] font-medium text-amber-900 dark:text-amber-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold">{t.headerOvertimeBadge}</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-800 dark:text-slate-200 font-bold">{totalPeriodHours.toFixed(1)}h</span>
                <span className="bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                  +{overtimeHours.toFixed(1)}h &gt; 80h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
