import { BiweeklyPeriod, DayOff, DaySchedule, TimeEntry } from '../types/timesheet';

/**
 * Parses "HH:mm" 24h string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to "HH:mm" 24h string
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates net worked hours from start/end times and unpaid meal break minutes
 */
export function calculateNetHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): number {
  if (!startTime || !endTime) return 0;
  const startM = timeStringToMinutes(startTime);
  const endM = timeStringToMinutes(endTime);

  // If end is before start, assume it rolls into midnight
  const grossMinutes = endM >= startM ? endM - startM : endM + 1440 - startM;
  const netMinutes = Math.max(0, grossMinutes - (breakMinutes || 0));
  return Math.round((netMinutes / 60) * 100) / 100;
}

/**
 * Formats "HH:mm" (24h) to "9:00 AM" / "5:30 PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Formats decimal hours into "7h 45m" and "7.75 hrs"
 */
export function formatHoursWithDecimals(hours: number): string {
  return `${hours.toFixed(2)} hrs`;
}

export function formatHoursAndMinutes(hours: number): string {
  const totalM = Math.round(hours * 60);
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats meal break minutes into hours and min (e.g. "0 hrs 30 min", "1 hr 15 min")
 */
export function formatBreakDuration(minutes: number): string {
  const totalM = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  const hLabel = h === 1 ? '1 hr' : `${h} hrs`;
  return `${hLabel} ${m} min`;
}

/**
 * Compact formatting for table cells and badges (e.g. "0h 30m", "1h 00m")
 */
export function formatBreakCompact(minutes: number): string {
  const totalM = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  return `${h}h ${m}m`;
}

/**
 * Helper to format a Date object as "YYYY-MM-DD" local string
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses "YYYY-MM-DD" to a local Date object safely without timezone offset shifts
 */
export function parseISODate(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Finds the Monday of the week for any given date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sun, 1 is Mon, 6 is Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generates an array of biweekly periods anchored to an initial Monday
 */
export function generateBiweeklyPeriods(
  anchorMondayDate: Date = new Date(2026, 9, 5), // Oct 5, 2026 Monday
  periodsBefore: number = 4,
  periodsAfter: number = 8
): BiweeklyPeriod[] {
  const periods: BiweeklyPeriod[] = [];
  const anchorTime = anchorMondayDate.getTime();
  const biweekMs = 14 * 24 * 60 * 60 * 1000;

  for (let i = -periodsBefore; i <= periodsAfter; i++) {
    const periodStartTime = anchorTime + i * biweekMs;
    const periodStart = new Date(periodStartTime);
    const periodEnd = new Date(periodStartTime + 13 * 24 * 60 * 60 * 1000);

    const startISO = toISODateString(periodStart);
    const endISO = toISODateString(periodEnd);

    const startLabel = periodStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endLabel = periodEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Estimate pay period number (1-26 per year)
    const dayOfYear = Math.floor(
      (periodStart.getTime() - new Date(periodStart.getFullYear(), 0, 1).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    const periodNumber = Math.max(1, Math.floor(dayOfYear / 14) + 1);

    periods.push({
      id: `${startISO}_${endISO}`,
      startDate: startISO,
      endDate: endISO,
      label: `${startLabel} – ${endLabel}`,
      periodNumber,
      year: periodStart.getFullYear(),
    });
  }

  return periods;
}

/**
 * Returns the 14 days comprising a biweekly cycle starting from period.startDate
 */
export function getBiweeklyDays(startDateISO: string, locale: string = 'en-US'): DaySchedule[] {
  const days: DaySchedule[] = [];
  const baseDate = parseISODate(startDateISO);

  for (let i = 0; i < 14; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);

    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWorkday = !isWeekend;
    const weekNumber: 1 | 2 = i < 7 ? 1 : 2;

    const rawDayName = d.toLocaleDateString(locale, { weekday: 'short' });
    const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);

    days.push({
      date: toISODateString(d),
      dayOfWeek,
      dayName,
      formattedDate: d.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      }),
      isWeekend,
      isWorkday,
      weekNumber,
      dayIndex: i,
    });
  }

  return days;
}

/**
 * Formats a date into "Monday, Oct 5, 2026"
 */
export function formatFullDay(dateISO: string, locale: string = 'en-US'): string {
  const d = parseISODate(dateISO);
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns the date string (YYYY-MM-DD) of the last working day within a 14-day biweekly period.
 * Typically the second Friday (index 11), or the latest scheduled workday not marked as a day off.
 */
export function getLastWorkingDay(
  periodDays: DaySchedule[],
  daysOff: DayOff[] = [],
  entries: TimeEntry[] = []
): string {
  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));

  // Find all workdays (Mon-Fri) that are not marked as a day off
  const activeWorkdays = periodDays.filter((d) => d.isWorkday && !dayOffMap.has(d.date));
  if (activeWorkdays.length > 0) {
    return activeWorkdays[activeWorkdays.length - 1].date;
  }

  // If all workdays were marked off, check if actual work was recorded on any day
  const daysWithWork = periodDays.filter((d) =>
    entries.some((e) => e.date === d.date && e.netHours > 0)
  );
  if (daysWithWork.length > 0) {
    return daysWithWork[daysWithWork.length - 1].date;
  }

  // Fallback to standard last workday of the cycle (Friday of Week 2)
  const standardWorkdays = periodDays.filter((d) => d.isWorkday);
  if (standardWorkdays.length > 0) {
    return standardWorkdays[standardWorkdays.length - 1].date;
  }

  return periodDays[periodDays.length - 1]?.date || '';
}
