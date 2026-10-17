import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Briefcase, Check, Palette, Building2, Sparkles } from 'lucide-react';
import { Project, TimesheetProfile } from '../types/timesheet';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSaveProjects: (projects: Project[]) => void;
  profile: TimesheetProfile;
  onUpdateClientName?: (newClient: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Violet', hex: '#9333EA' },
  { name: 'Slate', hex: '#475569' },
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSaveProjects,
  profile,
  onUpdateClientName,
}) => {
  const currentClient = profile.employerName || 'Oakridge Custom Homes';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [client, setClient] = useState(currentClient);
  const [code, setCode] = useState('');
  const [tagColor, setTagColor] = useState(COLOR_PRESETS[0].hex);
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState(profile.defaultHourlyRate ?? 30);

  // Client name change state
  const [isEditingClientBanner, setIsEditingClientBanner] = useState(false);
  const [clientBannerInput, setClientBannerInput] = useState(currentClient);
  const [clientSuccessMsg, setClientSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientBannerInput(profile.employerName || 'Oakridge Custom Homes');
      if (!editingId) {
        setClient(profile.employerName || 'Oakridge Custom Homes');
      }
    }
  }, [isOpen, profile.employerName, editingId]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setClient(profile.employerName || 'Oakridge Custom Homes');
    setCode('');
    setTagColor(COLOR_PRESETS[0].hex);
    setBillable(true);
    setRate(profile.defaultHourlyRate ?? 30);
  };

  const handleStartEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setClient(p.client);
    setCode(p.code);
    setTagColor(p.tagColor || p.colorCode || p.color || COLOR_PRESETS[0].hex);
    setBillable(p.billable);
    setRate(p.rate || 0);
  };

  const handleApplyClientToAllProjects = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = clientBannerInput.trim();
    if (!trimmed) return;
    const oldClient = profile.employerName || 'Oakridge Custom Homes';

    // Update projects that belonged to oldClient or Oakridge Custom Homes
    const updated = projects.map((p) =>
      p.client.toLowerCase() === oldClient.toLowerCase() ||
      p.client.toLowerCase() === 'oakridge custom homes'
        ? { ...p, client: trimmed }
        : p
    );
    onSaveProjects(updated);

    if (onUpdateClientName) {
      onUpdateClientName(trimmed);
    }

    setIsEditingClientBanner(false);
    setClientSuccessMsg(`Client updated to "${trimmed}" across all associated projects & timesheet!`);
    setTimeout(() => setClientSuccessMsg(''), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalClient = client.trim() || profile.employerName || 'Oakridge Custom Homes';

    if (editingId) {
      const updated = projects.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: name.trim(),
              client: finalClient,
              code: code.trim().toUpperCase() || 'PRJ',
              color: tagColor,
              colorCode: tagColor,
              tagColor: tagColor,
              billable,
              rate: billable ? Number(rate) : 0,
            }
          : p
      );
      onSaveProjects(updated);
    } else {
      const newProj: Project = {
        id: `prj-${Date.now()}`,
        name: name.trim(),
        client: finalClient,
        code: code.trim().toUpperCase() || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        color: tagColor,
        colorCode: tagColor,
        tagColor: tagColor,
        billable,
        rate: billable ? Number(rate) : 0,
      };
      onSaveProjects([...projects, newProj]);
    }

    resetForm();
  };

  const handleUpdateProjectColor = (projId: string, newColor: string) => {
    onSaveProjects(
      projects.map((p) =>
        p.id === projId
          ? { ...p, color: newColor, colorCode: newColor, tagColor: newColor }
          : p
      )
    );
  };

  const handleDelete = (id: string) => {
    if (projects.length <= 1) {
      alert('You must have at least one active project.');
      return;
    }
    const updated = projects.filter((p) => p.id !== id);
    onSaveProjects(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Manage Projects & Client Name
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Active Client Name Quick-Change Banner */}
          <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Primary Client:
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white underline decoration-amber-400 decoration-2">
                      {profile.employerName || 'Oakridge Custom Homes'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Used across timesheet headers, audit exports, and project assignments.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditingClientBanner((prev) => !prev);
                  setClientBannerInput(profile.employerName || 'Oakridge Custom Homes');
                }}
                className="self-start sm:self-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-200/90 dark:bg-amber-800/80 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-950 dark:text-amber-100 transition-colors shadow-2xs whitespace-nowrap"
              >
                {isEditingClientBanner ? 'Cancel' : 'Change Client Name'}
              </button>
            </div>

            {/* Inline Editor for Changing Client Name */}
            {isEditingClientBanner && (
              <form onSubmit={handleApplyClientToAllProjects} className="pt-2 border-t border-amber-200 dark:border-amber-800/60 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  New Client Name:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={clientBannerInput}
                    onChange={(e) => setClientBannerInput(e.target.value)}
                    placeholder="e.g. Oakridge Custom Homes"
                    className="flex-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientBannerInput('Oakridge Custom Homes')}
                      className="px-2 py-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap"
                      title="Reset back to Oakridge Custom Homes"
                    >
                      Reset default
                    </button>
                  </div>
                </div>
              </form>
            )}

            {clientSuccessMsg && (
              <div className="pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{clientSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{editingId ? 'Edit Project & Color Tag' : 'Add New Project'}</span>
              </h3>
              {/* Live Preview Indicator */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Preview:</span>
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: tagColor }}
                />
                <span className="font-semibold text-slate-900 dark:text-white max-w-[120px] truncate text-xs">
                  {name.trim() || 'Project Name'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Building Custom House (First floor)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Client / Account
                  </label>
                  {client !== currentClient && (
                    <button
                      type="button"
                      onClick={() => setClient(currentClient)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Use "{currentClient}"
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder={currentClient}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Project Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="AGC-102"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Billable?
                </label>
                <div className="flex items-center gap-2 h-9">
                  <input
                    type="checkbox"
                    id="isBillable"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="isBillable" className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                    Yes (Billable)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Hourly Rate ({profile.currencySymbol}/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={rate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRate(val);
                    if (val > 0 && !billable) setBillable(true);
                  }}
                  className="w-24 max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            {/* Color Tag Selection */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Project Tag Color
                </label>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  {tagColor}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setTagColor(c.hex)}
                    title={`${c.name} (${c.hex})`}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-115 flex items-center justify-center shadow-2xs"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: tagColor.toLowerCase() === c.hex.toLowerCase() ? '#0f172a' : 'transparent',
                    }}
                  >
                    {tagColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white stroke-3 drop-shadow-xs" />
                    )}
                  </button>
                ))}

                {/* Custom Color Picker */}
                <div className="relative inline-flex items-center ml-1">
                  <input
                    type="color"
                    id="customTagColorInput"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border border-slate-300 dark:border-slate-600 p-0 overflow-hidden bg-transparent"
                    title="Choose custom color hex"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                {editingId ? 'Update Project & Tag' : 'Save Project & Tag'}
              </button>
            </div>
          </form>

          {/* Existing Projects List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Existing Projects & Hourly Rates ({projects.length})
            </h3>
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <label className="relative cursor-pointer shrink-0" title={`Project tag color: ${p.tagColor || p.colorCode || p.color}. Click to change.`}>
                      <span
                        className="w-4 h-4 rounded-full block ring-2 ring-white dark:ring-slate-700 shadow-xs border border-slate-300 dark:border-slate-600 hover:scale-115 transition-transform"
                        style={{ backgroundColor: p.tagColor || p.colorCode || p.color }}
                      />
                      <input
                        type="color"
                        value={p.tagColor || p.colorCode || p.color}
                        onChange={(e) => handleUpdateProjectColor(p.id, e.target.value)}
                        className="sr-only"
                      />
                    </label>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                          {p.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.client}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Inline Editable Rate */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 transition-colors">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {profile.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={p.rate}
                        onChange={(e) => {
                          const newRate = Number(e.target.value);
                          onSaveProjects(
                            projects.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, rate: newRate, billable: newRate > 0 }
                                : proj
                            )
                          );
                        }}
                        className="w-14 text-xs font-mono font-bold text-slate-900 dark:text-white bg-transparent text-right focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded px-1"
                        title="Click to edit hourly rate"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">/hr</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
