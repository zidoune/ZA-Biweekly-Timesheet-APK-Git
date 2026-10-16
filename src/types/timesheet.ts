export interface Project {
  id: string;
  name: string;
  client: string;
  code: string;
  color: string; // Primary hex color
  colorCode?: string; // Color-coding tag property
  tagColor?: string; // Tag color for visual project identification
  billable: boolean;
  rate: number; // Hourly rate in currency
  description?: string; // Scope of work or project notes
  notes?: string; // Project audit notes
}

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour format)
  endTime: string; // HH:mm (24-hour format)
  breakMinutes: number; // Unpaid meal break duration in minutes (e.g. 0, 30, 45, 60)
  netHours: number; // Calculated: ((endTime - startTime in minutes) - breakMinutes) / 60
  description?: string;
  notes?: string;
  isOvertime?: boolean;
  employeeId?: string; // Identifier attributing entry to specific employee
}

export interface BiweeklyPeriod {
  id: string;
  startDate: string; // Monday YYYY-MM-DD
  endDate: string; // Sunday YYYY-MM-DD (14th day)
  label: string; // e.g. "Oct 05, 2026 – Oct 18, 2026"
  periodNumber: number; // e.g. 21
  year: number;
}

export interface TimesheetProfile {
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  employerName: string;
  employerPhone: string;
  employeeId?: string; // Unique Employee ID (e.g., EMP-001)
  title: string;
  department: string;
  supervisorName: string;
  targetWorkingDays: number; // 10 working days
  dailyStandardHours: number; // 8.0 hrs
  defaultBreakMinutes: number; // 30 mins
  currencySymbol: string; // '$'
  defaultHourlyRate?: number; // Standard hourly rate
  overtimeThreshold?: number; // Hours per biweekly period triggering overtime pay (e.g. 80 hrs)
  overtimeRateMultiplier?: number; // Multiplier for overtime pay calculations (e.g. 1.5)
  // Contractor Permissions
  contractorPermissions?: boolean; // When true, user has authority to enter timesheets for other crew members
  isContractor?: boolean;
  role?: 'contractor' | 'employee' | 'supervisor' | 'admin';
}

export interface ManagedEmployee {
  id: string; // Internal record identifier
  employeeId: string; // Unique Employee ID (e.g. EMP-101)
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
  title?: string;
  department?: string;
  supervisorName?: string;
  defaultHourlyRate?: number;
  dailyStandardHours?: number;
  notes?: string;
  createdAt?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  dayName: string; // Mon, Tue, etc.
  formattedDate: string; // Oct 05
  isWeekend: boolean;
  isWorkday: boolean; // Mon-Fri
  weekNumber: 1 | 2;
  dayIndex: number; // 0 to 13
  isDayOff?: boolean;
  dayOffReason?: string;
}

export interface DayOff {
  id?: string;
  date: string; // YYYY-MM-DD
  reason?: string; // e.g. "Scheduled Day Off", "Holiday", "Paid Time Off (PTO)", "Sick Leave", "Didn't work"
  isPaid?: boolean;
  notes?: string;
  isDidNotWork?: boolean; // True if employee marked that they didn't work on this day
}

export interface CustomSignatureConfig {
  enabled: boolean;
  title: string; // e.g. "General Contractor Sign-off", "Client Acceptance", "Building Inspector"
  name: string; // Name of signee or blank for manual pen sign
  statement?: string; // Custom declaration statement
  date?: string; // Date string or blank
  isManualInk?: boolean; // Show signature line with (X ______________)
}

export interface PdfExportCustomization {
  includeProjectNotes: boolean;
  includedProjectIds?: string[]; // IDs of specific projects whose notes are included (if empty/all selected, all projects)
  customProjectNotes?: Record<string, string>; // Optional custom note per project
  customSignature: CustomSignatureConfig;
}
