import { DayOff, ManagedEmployee, Project, TimeEntry, TimesheetProfile } from '../types/timesheet';

const STORAGE_KEYS = {
  PROJECTS: 'chronos_timesheet_projects_v4',
  ENTRIES: 'chronos_timesheet_entries_v4',
  PROFILE: 'chronos_timesheet_profile_v4',
  ACTIVE_TIMER: 'chronos_timesheet_active_timer_v4',
  DAYS_OFF: 'chronos_timesheet_days_off_v4',
  MANAGED_EMPLOYEES: 'chronos_timesheet_managed_employees_v4',
  ACTIVE_EMPLOYEE_ID: 'chronos_timesheet_active_employee_id_v4',
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-custom-house',
    name: 'Building Custom House (First floor)',
    client: 'Oakridge Custom Homes',
    code: 'First floor',
    color: '#D97706', // Warm Amber / Construction Gold
    colorCode: '#D97706',
    tagColor: '#D97706',
    billable: true,
    rate: 95,
  },
  {
    id: 'prj-res-const',
    name: 'Residential Construction',
    client: 'Oakridge Custom Homes',
    code: 'RC-204',
    color: '#2563EB', // Blue
    colorCode: '#2563EB',
    tagColor: '#2563EB',
    billable: true,
    rate: 95,
  },
  {
    id: 'prj-building-walls',
    name: 'Building Walls',
    client: 'Oakridge Custom Homes',
    code: 'BW-102',
    color: '#059669', // Emerald
    colorCode: '#059669',
    tagColor: '#059669',
    billable: true,
    rate: 95,
  },
  {
    id: 'prj-building-subfloor',
    name: 'Building Subfloor',
    client: 'Oakridge Custom Homes',
    code: 'BSF-103',
    color: '#0891B2', // Cyan / Teal
    colorCode: '#0891B2',
    tagColor: '#0891B2',
    billable: true,
    rate: 95,
  },
  {
    id: 'prj-building-roof',
    name: 'Building a Roof',
    client: 'Oakridge Custom Homes',
    code: 'BAR-104',
    color: '#EA580C', // Terracotta Orange
    colorCode: '#EA580C',
    tagColor: '#EA580C',
    billable: true,
    rate: 95,
  },
  {
    id: 'prj-framing',
    name: 'Framing & Structural Carpentry',
    client: 'Highland Heights Phase II',
    code: 'FRM-108',
    color: '#4F46E5', // Indigo
    colorCode: '#4F46E5',
    tagColor: '#4F46E5',
    billable: true,
    rate: 85,
  },
];

export const INITIAL_PROFILE: TimesheetProfile = {
  employeeName: '[ Name and last name ]',
  employeeEmail: 'example@gmail.com',
  employeePhone: '(555) 234-5678',
  employerName: 'Oakridge Custom Homes',
  employerPhone: '(555) 890-1234',
  employeeId: 'EMP-001',
  title: 'Site Superintendent / Project Lead',
  department: 'Residential Construction Division',
  supervisorName: 'Jacob Demontigny',
  targetWorkingDays: 10,
  dailyStandardHours: 8.0,
  defaultBreakMinutes: 30,
  currencySymbol: '$',
  defaultHourlyRate: 30,
  overtimeThreshold: 80,
  overtimeRateMultiplier: 1.5,
  contractorPermissions: true,
  isContractor: true,
  role: 'contractor',
};

export const INITIAL_MANAGED_EMPLOYEES: ManagedEmployee[] = [
  {
    id: 'emp-rec-102',
    employeeId: 'EMP-102',
    employeeName: 'Marcus Vance',
    employeeEmail: 'marcus.vance@oakridgehomes.com',
    employeePhone: '(555) 345-6789',
    title: 'Journeyman Framer',
    department: 'Structural Carpentry',
    supervisorName: '[ Name and last name ]',
    defaultHourlyRate: 85,
    dailyStandardHours: 8.0,
    notes: 'Primary framing & subfloor lead',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'emp-rec-103',
    employeeId: 'EMP-103',
    employeeName: 'Sarah Jenkins',
    employeeEmail: 'sarah.j@oakridgehomes.com',
    employeePhone: '(555) 456-7890',
    title: 'Finish & Trim Carpenter',
    department: 'Interior & Exterior Millwork',
    supervisorName: '[ Name and last name ]',
    defaultHourlyRate: 88,
    dailyStandardHours: 8.0,
    notes: 'Specializes in roof trusses & wall squaring',
    createdAt: '2026-10-02T08:00:00.000Z',
  },
];

export const INITIAL_ENTRIES: TimeEntry[] = [
  {
    id: 'entry-01',
    projectId: 'prj-building-subfloor',
    date: '2026-10-05',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Subfloor joists layout & plywood decking',
  },
  {
    id: 'entry-02',
    projectId: 'prj-building-walls',
    date: '2026-10-06',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Load-bearing exterior wall framing & ties',
  },
  {
    id: 'entry-03',
    projectId: 'prj-building-walls',
    date: '2026-10-07',
    startTime: '08:00',
    endTime: '17:30',
    breakMinutes: 60,
    netHours: 8.5,
    isOvertime: true,
    notes: 'Header installation & double top plates',
  },
  {
    id: 'entry-04',
    projectId: 'prj-building-roof',
    date: '2026-10-08',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Roof truss lifting & temporary diagonal bracing',
  },
  {
    id: 'entry-05',
    projectId: 'prj-custom-house',
    date: '2026-10-09',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'First floor interior wall partitions',
  },
  {
    id: 'entry-06',
    projectId: 'prj-custom-house',
    date: '2026-10-12',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Window bucks & exterior door opening framing',
  },
  {
    id: 'entry-07',
    projectId: 'prj-custom-house',
    date: '2026-10-13',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Fire blocking, shear paneling & backing plates',
  },
  {
    id: 'entry-08',
    projectId: 'prj-custom-house',
    date: '2026-10-14',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Upper deck framing & ledger board flashing',
  },
  {
    id: 'entry-09',
    projectId: 'prj-building-roof',
    date: '2026-10-15',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Roof fascia & sub-fascia installation',
  },
  {
    id: 'entry-10',
    projectId: 'prj-custom-house',
    date: '2026-10-16',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 60,
    netHours: 8.0,
    notes: 'Framing punch-list verification & site cleanup',
  },
];

export interface ActiveTimerState {
  projectId: string;
  description?: string;
  startTimeISO: string;
  breakMinutes: number;
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    let list = INITIAL_PROJECTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
    // Filter out removed projects:
    // 1. Site Safety & Building Code Inspection (INSP-012)
    // 2. Interior Finishing & Millwork (FIN-305)
    list = list.filter(
      (p) =>
        p.id !== 'prj-inspection' &&
        p.code !== 'INSP-012' &&
        !p.name.toLowerCase().includes('site safety') &&
        p.id !== 'prj-finishing' &&
        p.code !== 'FIN-305' &&
        !p.name.toLowerCase().includes('interior finishing')
    );
    // Migrate Building Custom House (BCH-101) to Building Custom House (First floor)
    list = list.map((p) => {
      if (
        p.id === 'prj-custom-house' ||
        p.code === 'BCH-101' ||
        (p.name.toLowerCase().includes('custom house') && !p.name.toLowerCase().includes('first floor'))
      ) {
        return {
          ...p,
          name: 'Building Custom House (First floor)',
          code: 'First floor',
        };
      }
      return p;
    });

    // Ensure all requested active construction projects exist in the list
    const activeConstructionProjects = [
      INITIAL_PROJECTS.find((p) => p.id === 'prj-custom-house'),
      INITIAL_PROJECTS.find((p) => p.id === 'prj-res-const'),
      INITIAL_PROJECTS.find((p) => p.id === 'prj-building-walls'),
      INITIAL_PROJECTS.find((p) => p.id === 'prj-building-subfloor'),
      INITIAL_PROJECTS.find((p) => p.id === 'prj-building-roof'),
    ].filter(Boolean) as Project[];

    for (const req of activeConstructionProjects) {
      const exists = list.some(
        (p) =>
          p.id === req.id ||
          p.name.trim().toLowerCase() === req.name.trim().toLowerCase()
      );
      if (!exists) {
        list.push(req);
      }
    }
    return list;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function loadEntries(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    let list = INITIAL_ENTRIES;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
    // Re-map any legacy entries assigned to removed projects & populate initial notes if missing
    return list.map((e) => {
      let updated = { ...e };
      if (updated.projectId === 'prj-inspection') {
        updated.projectId = 'prj-res-const';
      }
      if (updated.projectId === 'prj-finishing') {
        updated.projectId = 'prj-building-roof';
      }
      if (!updated.notes) {
        const init = INITIAL_ENTRIES.find((ie) => ie.id === updated.id);
        if (init?.notes) {
          updated.notes = init.notes;
        }
      }
      // Migrate legacy default working day times to 8:00 AM - 5:00 PM (with 60m lunch break -> 8.0h)
      if (updated.startTime === '07:00' && (updated.endTime === '15:30' || updated.endTime === '15:00')) {
        updated.startTime = '08:00';
        updated.endTime = '17:00';
        updated.breakMinutes = 60;
        updated.netHours = 8.0;
      } else if (updated.startTime === '06:45' && updated.endTime === '15:30') {
        updated.startTime = '08:00';
        updated.endTime = '17:30';
        updated.breakMinutes = 60;
        updated.netHours = 8.5;
      } else if (updated.startTime === '07:15' && updated.endTime === '15:45') {
        updated.startTime = '08:00';
        updated.endTime = '17:00';
        updated.breakMinutes = 60;
        updated.netHours = 8.0;
      }
      return updated;
    });
  } catch {
    return INITIAL_ENTRIES;
  }
}

export function saveEntries(entries: TimeEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

export function loadProfile(): TimesheetProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return INITIAL_PROFILE;
    const parsed = JSON.parse(raw);
    const email = parsed.employeeEmail || INITIAL_PROFILE.employeeEmail;
    const employeeId = parsed.employeeId || INITIAL_PROFILE.employeeId || 'EMP-001';
    return {
      ...INITIAL_PROFILE,
      ...parsed,
      employeeId,
      employeeEmail: email,
      employeeName: parsed.employeeName || INITIAL_PROFILE.employeeName,
      employeePhone: parsed.employeePhone || INITIAL_PROFILE.employeePhone,
      employerName: parsed.employerName || INITIAL_PROFILE.employerName,
      employerPhone: parsed.employerPhone || INITIAL_PROFILE.employerPhone,
      supervisorName:
        parsed.supervisorName === 'Jacob Demontigny, General Contractor'
          ? 'Jacob Demontigny'
          : parsed.supervisorName || INITIAL_PROFILE.supervisorName,
      defaultBreakMinutes:
        parsed.defaultBreakMinutes === 60 || parsed.defaultBreakMinutes == null
          ? 30
          : parsed.defaultBreakMinutes,
      defaultHourlyRate: (parsed.defaultHourlyRate === 95 || parsed.defaultHourlyRate == null) ? 30 : parsed.defaultHourlyRate,
      overtimeThreshold: parsed.overtimeThreshold ?? INITIAL_PROFILE.overtimeThreshold,
      overtimeRateMultiplier: parsed.overtimeRateMultiplier ?? INITIAL_PROFILE.overtimeRateMultiplier,
      contractorPermissions: parsed.contractorPermissions ?? INITIAL_PROFILE.contractorPermissions,
      isContractor: parsed.isContractor ?? INITIAL_PROFILE.isContractor,
      role: parsed.role || INITIAL_PROFILE.role,
    };
  } catch {
    return INITIAL_PROFILE;
  }
}

export function saveProfile(profile: TimesheetProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadManagedEmployees(): ManagedEmployee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MANAGED_EMPLOYEES);
    if (!raw) return INITIAL_MANAGED_EMPLOYEES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_MANAGED_EMPLOYEES;
  } catch {
    return INITIAL_MANAGED_EMPLOYEES;
  }
}

export function saveManagedEmployees(employees: ManagedEmployee[]): void {
  localStorage.setItem(STORAGE_KEYS.MANAGED_EMPLOYEES, JSON.stringify(employees));
}

export function loadActiveEmployeeId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_EMPLOYEE_ID);
  } catch {
    return null;
  }
}

export function saveActiveEmployeeId(id: string | null): void {
  if (!id) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMPLOYEE_ID);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EMPLOYEE_ID, id);
  }
}

export function loadActiveTimer(): ActiveTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveTimer(timer: ActiveTimerState | null): void {
  if (!timer) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(timer));
  }
}

export function loadDaysOff(): DayOff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAYS_OFF);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveDaysOff(daysOff: DayOff[]): void {
  localStorage.setItem(STORAGE_KEYS.DAYS_OFF, JSON.stringify(daysOff));
}
