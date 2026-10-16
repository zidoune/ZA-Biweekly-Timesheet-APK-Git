import { BiweeklyPeriod, DayOff, Project, TimeEntry, TimesheetProfile } from '../types/timesheet';
import { getBiweeklyDays, getLastWorkingDay } from './dateUtils';

export interface CsvExportOptions {
  period: BiweeklyPeriod;
  profile: TimesheetProfile;
  projects: Project[];
  entries: TimeEntry[];
  daysOff?: DayOff[];
  locale?: string;
}

/**
 * Escapes a cell value conforming to RFC 4180 CSV specifications.
 */
function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a single CSV row from an array of cell values.
 */
function formatCsvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

/**
 * Generates the full CSV string for external payroll processing.
 */
export function generateTimesheetCsvString({
  period,
  profile,
  projects,
  entries,
  daysOff = [],
  locale = 'en-US',
}: CsvExportOptions): string {
  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));

  const periodDays = getBiweeklyDays(period.startDate, locale);
  const periodDateSet = new Set(periodDays.map((d) => d.date));

  const periodEntries = entries
    .filter((e) => periodDateSet.has(e.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  // All unworked days (day off, leave, didn't work) have 0 worked hours
  const unworkedDaySet = new Set(daysOff.map((d) => d.date));

  const getEffectiveNet = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    return e.netHours;
  };

  const periodDaysOff = daysOff.filter((d) => periodDateSet.has(d.date));
  const periodDaysOffCount = periodDaysOff.length;
  const effectiveTargetDays = Math.max(0, profile.targetWorkingDays - periodDaysOffCount);
  const targetHours = effectiveTargetDays * profile.dailyStandardHours;

  // Map total effective worked hours per date to determine if a day has 0.00 hours of work
  const dailyWorkedHoursMap = new Map<string, number>();
  periodEntries.forEach((e) => {
    const eff = getEffectiveNet(e);
    dailyWorkedHoursMap.set(e.date, (dailyWorkedHoursMap.get(e.date) || 0) + eff);
  });

  // Do not count meal breaks when there is 0.00 hours of work in that day
  const getEffectiveBreakMinutes = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    const dayWorked = dailyWorkedHoursMap.get(e.date) || 0;
    if (dayWorked <= 0) return 0;
    return e.breakMinutes || 0;
  };

  const totalNetHours = periodEntries.reduce((acc, curr) => acc + getEffectiveNet(curr), 0);
  const totalBreakMinutes = periodEntries.reduce((acc, curr) => acc + getEffectiveBreakMinutes(curr), 0);

  const otThreshold =
    profile.overtimeThreshold != null && profile.overtimeThreshold > 0
      ? profile.overtimeThreshold
      : targetHours;

  const regularHours = Math.min(totalNetHours, otThreshold);
  const overtimeHours = Math.max(0, totalNetHours - otThreshold);
  const otMultiplier = profile.overtimeRateMultiplier || 1.5;
  const baseHourlyRate = profile.defaultHourlyRate != null ? profile.defaultHourlyRate : 30;

  const overtimePremiumPay =
    overtimeHours > 0 ? overtimeHours * baseHourlyRate * (otMultiplier - 1) : 0;

  // Gross Pay: strictly Total Net Hours multiplied by Base Hourly Rate
  const totalPayment = totalNetHours * baseHourlyRate;

  const lastWorkingDayDate = getLastWorkingDay(periodDays, daysOff, entries);

  const rows: string[] = [];

  // Tabular column headers
  rows.push(
    formatCsvRow([
      'Date',
      'Day',
      'Day Type',
      'Project Code',
      'Project Name',
      'Billable',
      'Start Time',
      'End Time',
      'Meal Break (min)',
      'Net Hours',
      'Hourly Rate',
      'Gross Pay',
      'Overtime',
      'Status',
      'Notes',
    ])
  );

  // Day-by-day rows
  periodDays.forEach((daySchedule) => {
    const dayEntries = periodEntries.filter((e) => e.date === daySchedule.date);
    const dayOff = dayOffMap.get(daySchedule.date);
    const isDidNotWork = Boolean(dayOff?.isDidNotWork || dayOff?.reason === "Didn't work");
    const isScheduledDayOff = Boolean(dayOff && !isDidNotWork);

    if (dayEntries.length === 0) {
      let status = 'Regular Workday';
      if (dayOff) {
        status = isScheduledDayOff
          ? `Scheduled Day Off: ${dayOff.reason}`
          : `Did Not Work: ${dayOff.reason}`;
      } else if (daySchedule.isWeekend) {
        status = 'Weekend';
      } else {
        status = 'No Hours Logged';
      }

      rows.push(
        formatCsvRow([
          daySchedule.date,
          daySchedule.dayName,
          daySchedule.isWorkday ? 'Workday' : 'Weekend',
          '',
          '',
          'No',
          '',
          '',
          0,
          '0.00',
          baseHourlyRate.toFixed(2),
          '0.00',
          'No',
          status,
          dayOff ? dayOff.reason : '',
        ])
      );
    } else {
      dayEntries.forEach((entry) => {
        const proj = projectMap.get(entry.projectId);
        const effectiveHours = getEffectiveNet(entry);
        const rate = proj?.rate != null ? proj.rate : baseHourlyRate;
        const entryGross = effectiveHours * rate;

        let status = 'Worked';
        if (isScheduledDayOff) {
          status = `Scheduled Day Off (Recorded: 0.00 hrs) - ${dayOff?.reason || 'Day Off'}`;
        } else if (isDidNotWork) {
          status = `Did Not Work Override (${dayOff?.reason || ''})`;
        } else if (entry.isOvertime) {
          status = 'Overtime Worked';
        }

        rows.push(
          formatCsvRow([
            entry.date,
            daySchedule.dayName,
            daySchedule.isWorkday ? 'Workday' : 'Weekend',
            proj?.id || '',
            proj?.name || 'General Work',
            proj?.billable ? 'Yes' : 'No',
            entry.startTime,
            entry.endTime,
            getEffectiveBreakMinutes(entry),
            effectiveHours.toFixed(2),
            rate.toFixed(2),
            entryGross.toFixed(2),
            entry.isOvertime ? 'Yes' : 'No',
            status,
            entry.description || '',
          ])
        );
      });
    }
  });

  // Empty separator
  rows.push('');

  // Summary Metrics Section
  rows.push(formatCsvRow(['--- PAYROLL SUMMARY & AUDIT CERTIFICATION ---', '', '']));
  rows.push(formatCsvRow(['Metric', 'Value', 'Unit / Note']));
  rows.push(formatCsvRow(['Employee Name', profile.employeeName, '']));
  rows.push(formatCsvRow(['Employee Email / ID', profile.employeeEmail, '']));
  rows.push(formatCsvRow(['Supervisor / Approver', profile.supervisorName, '']));
  rows.push(formatCsvRow(['Job Title', profile.title, '']));
  rows.push(formatCsvRow(['Department', profile.department, '']));
  rows.push(formatCsvRow(['Biweekly Period', `${period.startDate} to ${period.endDate}`, `Cycle #${period.periodNumber}`]));
  rows.push(formatCsvRow(['Total Worked Hours', totalNetHours.toFixed(2), 'hrs']));
  rows.push(formatCsvRow(['Regular Hours', regularHours.toFixed(2), 'hrs']));
  rows.push(formatCsvRow(['Overtime Hours', overtimeHours.toFixed(2), 'hrs']));
  rows.push(formatCsvRow(['Overtime Threshold', otThreshold.toFixed(1), 'hrs per biweekly period']));
  rows.push(formatCsvRow(['Base Hourly Rate', baseHourlyRate.toFixed(2), `${profile.currencySymbol || '$'}/hr`]));
  rows.push(formatCsvRow(['Overtime Multiplier', `${otMultiplier}x`, '']));
  rows.push(formatCsvRow(['Overtime Premium Pay', overtimePremiumPay.toFixed(2), profile.currencySymbol || '$']));
  rows.push(formatCsvRow(['Total Gross Pay', totalPayment.toFixed(2), profile.currencySymbol || '$']));
  rows.push(formatCsvRow(['Total Meal Break Deduction', `${Math.floor(totalBreakMinutes / 60)}h ${totalBreakMinutes % 60}m`, `${totalBreakMinutes} mins total`]));
  rows.push(formatCsvRow(['Logged Workdays', `${new Set(periodEntries.map((e) => e.date)).size}`, `out of ${effectiveTargetDays} target workdays`]));
  rows.push(formatCsvRow(['Approval Status', 'APPROVED FOR PAYROLL', 'Supervisor Authorization']));
  rows.push(formatCsvRow(['Certification & Authorization Date', lastWorkingDayDate, 'Last working day of 14-day period']));

  return rows.join('\r\n');
}

/**
 * Triggers browser download of the CSV timesheet file.
 */
export function downloadTimesheetCsv(options: CsvExportOptions): void {
  const csvContent = generateTimesheetCsvString(options);
  const cleanName = (options.profile.employeeName || 'employee')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = `timesheet_${cleanName}_period_${options.period.startDate}_to_${options.period.endDate}.csv`;

  // Prepend UTF-8 BOM so Excel on Windows & Mac opens special characters cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts the raw allDataJson string (containing profile, projects, entries, daysOff)
 * into a fully structured, RFC 4180 compliant CSV-formatted string.
 */
export function convertAllDataJsonToCsv(allDataJsonStr: string): string {
  const data = JSON.parse(allDataJsonStr);
  const profile: TimesheetProfile = data.profile || {};
  const projects: Project[] = data.projects || [];
  const entries: TimeEntry[] = data.entries || [];
  const daysOff: DayOff[] = data.daysOff || [];
  const exportedAt: string = data.exportedAt || new Date().toISOString();

  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));

  // Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const baseRate = profile.defaultHourlyRate != null ? profile.defaultHourlyRate : 95;

  const rows: string[] = [];

  // Metadata Banner
  rows.push(formatCsvRow(['CHRONOS BIWEEKLY TIMESHEET & AUDIT DATA EXPORT']));
  rows.push(formatCsvRow(['Export Timestamp', exportedAt]));
  rows.push(formatCsvRow(['Employee Full Name', profile.employeeName || '—']));
  rows.push(formatCsvRow(['Employee Email', profile.employeeEmail || '—']));
  rows.push(formatCsvRow(['Employer / Contractor', profile.employerName || '—']));
  rows.push(formatCsvRow(['Employer Phone', profile.employerPhone || '—']));
  rows.push(formatCsvRow(['Base Hourly Rate', `${profile.currencySymbol || '$'}${baseRate}/hr`]));
  rows.push('');

  // SECTION 1: TIME ENTRIES & PUNCHES
  rows.push(formatCsvRow(['--- TIME PUNCHES & WORKED HOURS ---']));
  rows.push(
    formatCsvRow([
      'Date',
      'Start Time',
      'End Time',
      'Meal Break (min)',
      'Net Hours Logged',
      'Effective Worked Hours',
      'Base Hourly Rate',
      'Gross Pay',
      'Project Code',
      'Project Name',
      'Client',
      'Billable',
      'Overtime',
      'Status / Classification',
      'Task Description / Notes',
    ])
  );

  let totalEffectiveHours = 0;
  let totalBreakMins = 0;

  sortedEntries.forEach((entry) => {
    const proj = projectMap.get(entry.projectId);
    const dayOff = dayOffMap.get(entry.date);
    const isUnworked = Boolean(dayOff);
    // Unworked hours on days marked as Day Off or Didn't Work are NOT counted (0 hrs)
    const effectiveHours = isUnworked ? 0 : (entry.netHours || 0);
    const entryGross = effectiveHours * baseRate;

    totalEffectiveHours += effectiveHours;
    totalBreakMins += entry.breakMinutes || 0;

    let status = 'Worked';
    if (dayOff) {
      status = dayOff.isDidNotWork
        ? `Didn't Work (${dayOff.reason || "Didn't work"}) - Unworked Day`
        : `Day Off (${dayOff.reason || 'Scheduled Day Off'}) - Unworked Day`;
    } else if (entry.isOvertime) {
      status = 'Overtime';
    }

    rows.push(
      formatCsvRow([
        entry.date,
        entry.startTime,
        entry.endTime,
        entry.breakMinutes || 0,
        (entry.netHours || 0).toFixed(2),
        effectiveHours.toFixed(2),
        baseRate.toFixed(2),
        entryGross.toFixed(2),
        proj?.code || '',
        proj?.name || 'General Work',
        proj?.client || '',
        proj?.billable ? 'Yes' : 'No',
        entry.isOvertime ? 'Yes' : 'No',
        status,
        entry.description || entry.notes || '',
      ])
    );
  });

  const totalGrossPay = totalEffectiveHours * baseRate;

  rows.push('');
  // SECTION 2: DAYS OFF & UNWORKED DAYS LOG
  rows.push(formatCsvRow(['--- DAYS OFF & UNWORKED DAYS LOG ---']));
  rows.push(
    formatCsvRow([
      'Date',
      'Classification / Reason',
      'Day Type',
      'Paid Leave',
      'Notes / Supervisor Comments',
    ])
  );

  const sortedDaysOff = [...daysOff].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedDaysOff.length === 0) {
    rows.push(formatCsvRow(['No days off recorded']));
  } else {
    sortedDaysOff.forEach((d) => {
      rows.push(
        formatCsvRow([
          d.date,
          d.reason || (d.isDidNotWork ? "Didn't work" : 'Scheduled Day Off'),
          d.isDidNotWork ? "Didn't Work" : 'Day Off / Leave',
          d.isPaid ? 'Yes' : 'No',
          d.notes || '',
        ])
      );
    });
  }

  rows.push('');
  // SECTION 3: PROJECTS DIRECTORY
  rows.push(formatCsvRow(['--- PROJECTS & JOB SITES DIRECTORY ---']));
  rows.push(formatCsvRow(['Project Name', 'Project Code', 'Client', 'Billable', 'Hourly Rate ($/hr)']));
  projects.forEach((p) => {
    rows.push(
      formatCsvRow([
        p.name,
        p.code || '',
        p.client || '',
        p.billable ? 'Yes' : 'No',
        p.rate != null ? p.rate.toFixed(2) : baseRate.toFixed(2),
      ])
    );
  });

  rows.push('');
  // SECTION 4: PERSONNEL & SETTINGS CONFIGURATION
  rows.push(formatCsvRow(['--- PERSONNEL & SETTINGS PROFILE ---']));
  rows.push(formatCsvRow(['Setting Name', 'Configured Value']));
  rows.push(formatCsvRow(['Employee Full Name', profile.employeeName || '—']));
  rows.push(formatCsvRow(['Employee Email', profile.employeeEmail || '—']));
  rows.push(formatCsvRow(['Employee Phone', profile.employeePhone || '—']));
  rows.push(formatCsvRow(['Employer / Contractor', profile.employerName || '—']));
  rows.push(formatCsvRow(['Employer Phone', profile.employerPhone || '—']));
  rows.push(formatCsvRow(['Supervisor / Approver', profile.supervisorName || '—']));
  rows.push(formatCsvRow(['Job Title', profile.title || '—']));
  rows.push(formatCsvRow(['Department', profile.department || '—']));
  rows.push(formatCsvRow(['Standard Workdays / Period', profile.targetWorkingDays ?? 10]));
  rows.push(formatCsvRow(['Standard Daily Hours', profile.dailyStandardHours ?? 8.0]));
  rows.push(formatCsvRow(['Default Meal Break (min)', profile.defaultBreakMinutes ?? 30]));
  rows.push(formatCsvRow(['Base Hourly Rate', `${profile.currencySymbol || '$'}${baseRate}/hr`]));
  rows.push(formatCsvRow(['Overtime Threshold', `${profile.overtimeThreshold ?? 80} hrs`]));
  rows.push(formatCsvRow(['Overtime Multiplier', `${profile.overtimeRateMultiplier ?? 1.5}x`]));

  rows.push('');
  // SECTION 5: PAYROLL & AUDIT TOTALS
  rows.push(formatCsvRow(['--- AUDIT & PAYROLL TOTALS ---']));
  rows.push(formatCsvRow(['Metric', 'Calculated Value', 'Unit / Details']));
  rows.push(formatCsvRow(['Total Worked Hours (Unworked Excluded)', totalEffectiveHours.toFixed(2), 'hrs']));
  rows.push(formatCsvRow(['Base Hourly Rate', baseRate.toFixed(2), `${profile.currencySymbol || '$'}/hr`]));
  rows.push(formatCsvRow(['Gross Pay (Total Hours × Base Rate)', totalGrossPay.toFixed(2), profile.currencySymbol || '$']));
  rows.push(formatCsvRow(['Total Meal Break Deductions', `${Math.floor(totalBreakMins / 60)}h ${totalBreakMins % 60}m`, `${totalBreakMins} min`]));
  rows.push(formatCsvRow(['Total Punches Recorded', entries.length, 'punches']));
  rows.push(formatCsvRow(['Total Days Off / Leaves', daysOff.length, 'days']));

  return rows.join('\r\n');
}

/**
 * Triggers a direct browser download of the CSV representation of allDataJson.
 */
export function downloadAllDataCsv(allDataJsonStr: string, employeeName?: string): void {
  const csvContent = convertAllDataJsonToCsv(allDataJsonStr);
  const cleanName = (employeeName || 'timesheet')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `chronos_timesheet_data_${cleanName}_${dateStr}.csv`;

  // Prepend UTF-8 BOM (\uFEFF) so Excel, Numbers, and Google Sheets display special characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

