import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  Wifi,
  PackageCheck,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instant' | 'cloud' | 'capacitor'>('instant');
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://chronos-timesheet.web.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentOrigin)}`;

  const capacitorCommands = `# 1. Install Capacitor Android tools
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Add Android platform
npx cap add android

# 3. Build optimized web bundle and sync
npm run build:android
npx cap sync android

# 4. Compile APK using Gradle (Debug APK)
cd android && ./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apk-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="apk-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Mobile App & APK Compilation
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Install as a native WebAPK or compile standalone APK/AAB packages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('instant')}
            className={`px-3 py-2.5 rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 font-semibold ${
              activeTab === 'instant'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1-Tap Install (WebAPK)
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-2.5 rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 font-semibold ${
              activeTab === 'cloud'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Cloud APK Builder
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`px-3 py-2.5 rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 font-semibold ${
              activeTab === 'capacitor'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Capacitor & Gradle
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* TAB 1: INSTANT INSTALL (WEBAPK) */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">
                      Native Android WebAPK Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    On Android devices, Google Play Services synthesizes a genuine system APK (WebAPK) directly from this application with full launcher integration and offline support.
                  </p>
                </div>
                {isInstalled || installSuccess ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    App Installed
                  </span>
                ) : isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Install WebAPK Now
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {isAndroid ? 'Use Chrome Menu ⋮' : 'Desktop / Android Ready'}
                  </span>
                )}
              </div>

              {/* Step by step installation */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-700" />
                  How to Install on Android Phone:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 pl-1 leading-relaxed">
                  <li>
                    Open this application link in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android device.
                  </li>
                  <li>
                    Tap the browser menu button (<span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">⋮</span> at the top right).
                  </li>
                  <li>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Android compiles and installs the <strong>Chronos WebAPK</strong> directly to your app drawer and home screen.
                  </li>
                </ol>
              </div>

              {/* Key Features Pill Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2.5">
                  <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px] text-slate-900">100% Offline</div>
                    <div className="text-[10px] text-slate-500">Service Worker cached</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px] text-slate-900">Standalone UI</div>
                    <div className="text-[10px] text-slate-500">No browser address bar</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px] text-slate-900">Live Sync</div>
                    <div className="text-[10px] text-slate-500">Firestore Cloud Sync</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOUD BUILDER (PWABUILDER / BUBBLEWRAP) */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm sm:text-base">
                      PWABuilder & Bubblewrap CLI
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Cloud Compilation
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  PWABuilder (developed by Microsoft & Google engineers) inspects our pre-configured Web App Manifest and icons, then compiles a production-ready <strong>Android APK file</strong> and Google Play <strong>AAB bundle</strong> in the cloud with zero build setup required.
                </p>
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    <span>Generate APK on PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentOrigin);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy App URL</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  What you get with PWABuilder:
                </h4>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  <li><strong>Signed APK:</strong> Ready for sideloading on any Android device without Google Play.</li>
                  <li><strong>AAB Package:</strong> Android App Bundle signed and formatted for Google Play Store upload.</li>
                  <li><strong>Digital Asset Links:</strong> Full verification for trusted web activities (TWA).</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CAPACITOR & GRADLE LOCAL COMPILATION */}
          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Local Android Studio & Gradle Build
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    <code className="text-blue-600 font-mono">capacitor.config.json</code> is configured in this repository.
                  </p>
                </div>
                <button
                  onClick={handleCopyCommands}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-900 p-3 sm:p-4 text-white font-mono text-[11px] sm:text-xs overflow-x-auto leading-relaxed border border-slate-800">
                <pre>{capacitorCommands}</pre>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>APK Output:</strong> Running <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">./gradlew assembleDebug</code> outputs your installable APK directly to <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">android/app/build/outputs/apk/debug/app-debug.apk</code>.
                </div>
              </div>
            </div>
          )}

          {/* PWA Manifest Validation Checklist */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              App Manifest & PWA Pre-Flight Status
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">Manifest ID / Scope</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">192px & 512px Icons</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">Maskable Safe Zone</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">Service Worker Cache</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Package: <strong className="font-mono text-slate-700">com.chronos.timesheet</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
