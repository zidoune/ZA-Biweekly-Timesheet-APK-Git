import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  badge: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English (Canada)',
    nativeLabel: 'English (Canada)',
    flag: '🇨🇦',
    badge: 'EN',
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    flag: '🇫🇷',
    badge: 'FR',
  },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Standard Language Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t.selectLanguage}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all select-none"
        title={`${t.language}: ${currentOption.nativeLabel}`}
      >
        <span className="text-sm leading-none" role="img" aria-label={currentOption.label}>
          {currentOption.flag}
        </span>
        <span className="font-bold tracking-wide text-slate-800 dark:text-slate-100 uppercase">
          {currentOption.badge}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {t.selectLanguage}
            </span>
          </div>

          <div className="py-1">
            {LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none" role="img" aria-label={item.label}>
                      {item.flag}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs">{item.nativeLabel}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shadow-2xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Segmented Switch footer */}
          <div className="px-2 pt-1 pb-1 border-t border-slate-100 dark:border-slate-700/80">
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-center">
              <button
                type="button"
                onClick={() => handleSelect('en')}
                className={`py-1 text-[11px] rounded-md font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇨🇦 EN
              </button>
              <button
                type="button"
                onClick={() => handleSelect('fr')}
                className={`py-1 text-[11px] rounded-md font-semibold transition-all ${
                  language === 'fr'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇫🇷 FR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
