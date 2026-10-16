import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { language, t } = useLanguage();

  const titleText = isDark
    ? language === 'fr'
      ? 'Passer en mode clair'
      : 'Switch to light mode'
    : language === 'fr'
    ? 'Passer en mode sombre'
    : 'Switch to dark mode';

  const labelText = isDark
    ? t.themeLight || 'Light'
    : t.themeDark || 'Dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 select-none shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
      title={titleText}
      aria-label={titleText}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 transition-transform hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-[11px] font-medium leading-none">
          {labelText}
        </span>
      )}
    </button>
  );
};
