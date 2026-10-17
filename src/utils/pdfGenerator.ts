import { jsPDF } from 'jspdf';
import {
  BiweeklyPeriod,
  CustomSignatureConfig,
  DayOff,
  Project,
  TimeEntry,
  TimesheetProfile,
} from '../types/timesheet';
import { formatFullDay, formatTime12h, getBiweeklyDays, getLastWorkingDay } from './dateUtils';

export interface PdfExportOptions {
  period: BiweeklyPeriod;
  profile: TimesheetProfile;
  projects: Project[];
  entries: TimeEntry[];
  daysOff?: DayOff[];
  includeProjectNotes?: boolean;
  includedProjectIds?: string[];
  customProjectNotes?: Record<string, string>;
  customSignature?: CustomSignatureConfig;
}

export function generateTimesheetPdf({
  period,
  profile,
  projects,
  entries,
  daysOff = [],
  includeProjectNotes = false,
  includedProjectIds,
  customProjectNotes = {},
  customSignature,
}: PdfExportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const marginX = 14;
  let currentY = 14;
  const generatedAt = new Date();
  // Replace the legacy default signee name in generated PDFs while preserving any custom name.
  const resolvedCustomSignature = customSignature
    ? {
        ...customSignature,
        name: customSignature.name?.trim() === 'Mark Callahan'
          ? 'Jacob Demontigny'
          : customSignature.name,
      }
    : undefined;

  // Add searchable document metadata without changing timesheet content.
  doc.setProperties({
    title: `Biweekly Timesheet Audit Report - ${profile.employeeName} - ${period.label}`,
    subject: `Timesheet audit for ${period.startDate} to ${period.endDate}`,
    author: 'Demontigny Carpentry',
    creator: 'ZA Biweekly Timesheet',
  });

  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  // Filter entries that fall inside this biweekly period
  const periodDays = getBiweeklyDays(period.startDate);
  const periodDateSet = new Set(periodDays.map((d) => d.date));
  const periodEntries = entries
    .filter((e) => periodDateSet.has(e.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  const dayOffMap = new Map<string, DayOff>();
  daysOff.forEach((d) => dayOffMap.set(d.date, d));
  const periodDaysOff = daysOff.filter((d) => periodDateSet.has(d.date));
  const periodDaysOffCount = periodDaysOff.length;
  const lastWorkingDayDate = getLastWorkingDay(periodDays, daysOff, entries);

  // All unworked days (day off, leave, didn't work) have 0 worked hours
  const unworkedDaySet = new Set(daysOff.map((d) => d.date));

  const getEffectiveNet = (e: TimeEntry) => {
    if (unworkedDaySet.has(e.date)) return 0;
    return e.netHours;
  };

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

  const totalNetHours = periodEntries.reduce((sum, e) => sum + getEffectiveNet(e), 0);
  const totalBreakMinutes = periodEntries.reduce((sum, e) => sum + getEffectiveBreakMinutes(e), 0);
  const effectiveTargetHours = Math.max(0, profile.targetWorkingDays - periodDaysOffCount) * profile.dailyStandardHours;
  const otThreshold = profile.overtimeThreshold != null && profile.overtimeThreshold > 0
    ? profile.overtimeThreshold
    : effectiveTargetHours;
  const regularHours = Math.min(totalNetHours, otThreshold);
  const overtimeHours = Math.max(0, totalNetHours - otThreshold);
  const otMultiplier = profile.overtimeRateMultiplier || 1.5;
  const baseRate = profile.defaultHourlyRate != null ? profile.defaultHourlyRate : 30;

  let totalBillableAmount = 0;
  periodEntries.forEach((e) => {
    const p = projectMap.get(e.projectId);
    const eff = getEffectiveNet(e);
    if (p && p.billable) {
      totalBillableAmount += eff * (p.rate || 0);
    }
  });

  // Gross Pay: strictly Total Net Hours multiplied by Base Hourly Rate
  const grossPay = totalNetHours * baseRate;
  const estimatedNetPay = grossPay * 0.812;
  const totalPayment = grossPay;

  // Helper function to check and add new page
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 14) {
      doc.addPage();
      currentY = 16;
      drawPageHeader(true);
    }
  };

  const drawPageHeader = (isContinuation: boolean = false) => {
    // Keep the report compact for tablet exports; omit the decorative blue top bar.
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);

    if (isContinuation) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `BIWEEKLY TIMESHEET AUDIT LOG · ${period.label} · ${profile.employeeName} (Cont.)`,
        marginX,
        currentY
      );
      currentY += 6;
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 6;
      return;
    }

    // Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('BIWEEKLY TIMESHEET & AUDIT REPORT', marginX, currentY);

    // Period indicator right aligned
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period #${period.periodNumber} · ${period.label}`, pageWidth - marginX, currentY, {
      align: 'right',
    });

    currentY += 7;
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;

    // Profile & Meta summary boxes
    const colWidth = (pageWidth - marginX * 2 - 8) / 2;

    // Left info box (Employee details)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(marginX, currentY, colWidth, 32, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, colWidth, 32, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('EMPLOYEE DETAILS', marginX + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Employee Name: ${profile.employeeName}`, marginX + 3.5, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Employee ID: ${profile.employeeId || '—'}`, marginX + 3.5, currentY + 13.5);
    doc.text(`Employee Email: ${profile.employeeEmail || '—'}`, marginX + 3.5, currentY + 17.5);
    doc.text(`${profile.title} · ${profile.employeePhone || '—'}`, marginX + 3.5, currentY + 21.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Hourly Rate: ${profile.currencySymbol}${profile.defaultHourlyRate ?? 30}/hr`, marginX + 3.5, currentY + 26.5);

    // Right info box (Employer & Period Totals)
    const rightColX = marginX + colWidth + 8;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightColX, currentY, colWidth, 32, 1.5, 1.5, 'F');
    doc.roundedRect(rightColX, currentY, colWidth, 32, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('EMPLOYER & AUDIT SUMMARY', rightColX + 3.5, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Employer Name: ${profile.employerName || '—'}`, rightColX + 3.5, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Employer Phone: ${profile.employerPhone || '—'}`, rightColX + 3.5, currentY + 14.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // emerald-600
    const summaryPaymentText = `Gross Pay: ${profile.currencySymbol || '$'}${grossPay.toFixed(2)}  (${totalNetHours.toFixed(2)}h @ ${profile.currencySymbol || '$'}${baseRate}/h)`;
    doc.text(summaryPaymentText, rightColX + 3.5, currentY + 19);
    // Show the requested estimated take-home amount directly in the audit summary.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(8, 145, 178); // cyan-600
    doc.text(
      `ESTIMATE NET PAY: ${profile.currencySymbol || '$'}${estimatedNetPay.toFixed(2)} (18.8% deduction)`,
      rightColX + 3.5,
      currentY + 24
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    if (periodDaysOffCount > 0) {
      doc.text(`Base Rate: ${profile.currencySymbol || '$'}${baseRate}/h · Breaks: ${Math.floor(totalBreakMinutes / 60)}h ${Math.round(totalBreakMinutes % 60)}m · Days Off: ${periodDaysOffCount}`, rightColX + 3.5, currentY + 29);
    } else {
      doc.text(`Base Rate: ${profile.currencySymbol || '$'}${baseRate}/h · Unpaid Breaks: ${Math.floor(totalBreakMinutes / 60)}h ${Math.round(totalBreakMinutes % 60)}m`, rightColX + 3.5, currentY + 29);
    }

    currentY += 34;
  };

  // 1. Initial Page Header
  drawPageHeader(false);

  // 2. Daily Punches Audit Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DAILY TIME PUNCH AUDIT LOG (14-DAY SCHEDULE)', marginX, currentY);
  currentY += 4;

  // Table Column Definitions (Total usable width: 187.9mm)
  const cols = [
    { header: 'Date', width: 26, align: 'left' },
    { header: 'Project / Code', width: 54, align: 'left' },
    { header: 'Client', width: 37.9, align: 'left' },
    { header: 'In (Punch)', width: 18, align: 'center' },
    { header: 'Out (Punch)', width: 18, align: 'center' },
    { header: 'Meal Break', width: 18, align: 'center' },
    { header: 'Net Hours', width: 16, align: 'right' },
  ];

  // Draw table header row
  const drawTableHeader = () => {
    // High-contrast navy table header remains clear in color and grayscale print.
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, currentY, pageWidth - marginX * 2, 6, 'F');
    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.45);
    doc.line(marginX, currentY + 6, pageWidth - marginX, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let colX = marginX;
    cols.forEach((col) => {
      const textX =
        col.align === 'center'
          ? colX + col.width / 2
          : col.align === 'right'
          ? colX + col.width - 2
          : colX + 2;
      doc.text(col.header, textX, currentY + 4.2, { align: col.align as any });
      colX += col.width;
    });
    currentY += 6;
  };

  drawTableHeader();

  // Iterate over all 14 days so empty days are audited as well
  let altRow = false;
  periodDays.forEach((daySchedule) => {
    const dayEntries = periodEntries.filter((e) => e.date === daySchedule.date);

    if (dayEntries.length === 0) {
      // Give each day row enough breathing room so the table is easier to read and the sign-off section sits lower on the page.
      const emptyRowHeight = 8.5;
      checkPageBreak(emptyRowHeight);

      if (altRow) {
        doc.setFillColor(250, 250, 250);
        doc.rect(marginX, currentY, pageWidth - marginX * 2, emptyRowHeight, 'F');
      }
      altRow = !altRow;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`${daySchedule.formattedDate} (${daySchedule.dayName})`, marginX + 2, currentY + 5.5);

      const dayOff = dayOffMap.get(daySchedule.date);
      if (dayOff) {
        const isDidNotWork = Boolean(dayOff.isDidNotWork || dayOff.reason === "Didn't work");
        if (isDidNotWork) {
          doc.setTextColor(225, 29, 72); // rose-600
          doc.setFont('helvetica', 'bold');
          doc.text(`[Didn't Work] ${dayOff.notes || dayOff.reason || "Didn't work"}`, marginX + 28, currentY + 5.5);
        } else {
          doc.setTextColor(180, 83, 9); // amber-700
          doc.setFont('helvetica', 'bold');
          doc.text(`[Day Off] ${dayOff.reason || 'Scheduled Day Off'}`, marginX + 28, currentY + 5.5);
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
      } else if (daySchedule.isWeekend) {
        doc.text('Weekend — No punch recorded', marginX + 28, currentY + 5.5);
      } else {
        doc.text('Off-duty / Scheduled off', marginX + 28, currentY + 5.5);
      }

      doc.setTextColor(148, 163, 184); // slate-400 gray for 0.00
      doc.text('0.00', pageWidth - marginX - 2, currentY + 5.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, currentY + emptyRowHeight, pageWidth - marginX, currentY + emptyRowHeight);
      currentY += emptyRowHeight;
    } else {
      dayEntries.forEach((entry) => {
        const proj = projectMap.get(entry.projectId);
        const projName = proj
          ? proj.code && !proj.name.includes(proj.code)
            ? `${proj.name} [${proj.code}]`
            : proj.name
          : 'General';
        const clientName = 'Demontigny Carpentry';

        const rowHeight = 8.5;

        checkPageBreak(rowHeight);

        if (altRow) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginX, currentY, pageWidth - marginX * 2, rowHeight, 'F');
        }
        altRow = !altRow;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${daySchedule.formattedDate} (${daySchedule.dayName})`, marginX + 2, currentY + 5.7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        // Project column truncated if needed
        const projTrunc = projName.length > 32 ? projName.substring(0, 30) + '...' : projName;
        doc.text(projTrunc, marginX + 28, currentY + 4.3);

        // Client column
        doc.setTextColor(71, 85, 105);
        const clientTrunc = clientName.length > 22 ? clientName.substring(0, 20) + '...' : clientName;
        doc.text(clientTrunc, marginX + 26 + 54 + 2, currentY + 4.3);

        // Punch Times
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const inColX = marginX + 26 + 54 + 37.9;
        doc.text(formatTime12h(entry.startTime), inColX + 9, currentY + 4.3, { align: 'center' });
        doc.text(formatTime12h(entry.endTime), inColX + 18 + 9, currentY + 4.3, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        const effBreak = getEffectiveBreakMinutes(entry);
        const isZeroWorkDay = unworkedDaySet.has(entry.date) || (dailyWorkedHoursMap.get(entry.date) || 0) <= 0;
        const breakText = isZeroWorkDay ? '—' : `${Math.floor(effBreak / 60)}h ${effBreak % 60}m`;
        doc.text(
          breakText,
          inColX + 36 + 9,
          currentY + 4.3,
          { align: 'center' }
        );

        // Net Hours
        doc.setFont('helvetica', 'bold');
        const isZeroNet = unworkedDaySet.has(entry.date) || entry.netHours === 0;
        const displayNet = unworkedDaySet.has(entry.date) ? '0.00' : entry.netHours.toFixed(2);
        if (isZeroNet) {
          doc.setTextColor(148, 163, 184); // slate-400 gray for 0.00
        } else {
          doc.setTextColor(15, 23, 42); // slate-900
        }
        doc.text(
          `${displayNet}`,
          pageWidth - marginX - 2,
          currentY + 4.3,
          { align: 'right' }
        );

        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, currentY + rowHeight, pageWidth - marginX, currentY + rowHeight);
        currentY += rowHeight;
      });
    }
  });

  // Daily Table Totals Row
  checkPageBreak(10);
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, pageWidth - marginX * 2, 7.5, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  doc.line(marginX, currentY + 7.5, pageWidth - marginX, currentY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PERIOD AUDIT TOTAL:', marginX + 2, currentY + 5);

  doc.text(
    `${totalNetHours.toFixed(2)} hrs`,
    pageWidth - marginX - 2,
    currentY + 5,
    { align: 'right' }
  );
  currentY += 6; // Keep the totals and sign-off sections closer together

  // 3. Verification & Formal Sign-off Section
  const isCustomSigActive = Boolean(resolvedCustomSignature && resolvedCustomSignature.enabled);
  checkPageBreak(isCustomSigActive ? 38 : 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COMPLIANCE & SIGN-OFF VERIFICATION', marginX, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I hereby certify under penalty of perjury that the recorded times, punch intervals, and meal break deductions reflect accurate work performed.',
    marginX,
    currentY
  );
  currentY += 2.5;

  if (isCustomSigActive && resolvedCustomSignature) {
    // 3 signature columns: Employee, Supervisor, and Custom (Client, GC, Inspector)
    const numCols = 3;
    const gap = 5;
    const colW = (pageWidth - marginX * 2 - gap * (numCols - 1)) / numCols;
    const boxH = 25;

    // Box 1: Employee Certification
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginX, currentY, colW, boxH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('EMPLOYEE CERTIFICATION', marginX + 3.0, currentY + 4.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(profile.employeeName, marginX + 3.0, currentY + 11.5);

    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginX + 3.0, currentY + 13.0, marginX + colW - 3.0, currentY + 13.0);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Sign: ${profile.employeeName}`, marginX + 3.0, currentY + 17.0);
    doc.text(`Date: ${lastWorkingDayDate}`, marginX + 3.0, currentY + 21.5);

    // Box 2: Supervisor Authorization
    const supColX = marginX + colW + gap;
    doc.setDrawColor(203, 213, 225);
    doc.rect(supColX, currentY, colW, boxH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SUPERVISOR AUTHORIZATION', supColX + 3.0, currentY + 4.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(profile.supervisorName, supColX + 3.0, currentY + 11.5);

    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(supColX + 3.0, currentY + 13.0, supColX + colW - 3.0, currentY + 13.0);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Approver: ${profile.supervisorName}`, supColX + 3.0, currentY + 17.0);
    doc.text('Status: APPROVED', supColX + 3.0, currentY + 21.5);
    doc.text(`Date: ${lastWorkingDayDate}`, supColX + colW - 3.0, currentY + 21.5, { align: 'right' });

    // Box 3: Custom Signature Line
    const custColX = marginX + (colW + gap) * 2;
    doc.setDrawColor(59, 130, 246); // highlight blue
    doc.rect(custColX, currentY, colW, boxH, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138); // blue-900
    const rawTitle = (resolvedCustomSignature.title || 'CUSTOM SIGN-OFF').toUpperCase();
    const sigTitle = rawTitle.length > 25 ? rawTitle.substring(0, 23) + '..' : rawTitle;
    doc.text(sigTitle, custColX + 3.0, currentY + 4.5);

    if (resolvedCustomSignature.isManualInk) {
      // Solid line for manual pen signature: X   ____________________
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('X', custColX + 3.0, currentY + 13.0);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(custColX + 8.5, currentY + 13.0, custColX + colW - 3.0, currentY + 13.0);

      // Distinct Signee label underneath the signature line with generous spacing
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const signeeText = resolvedCustomSignature.name ? `Signee:  ${resolvedCustomSignature.name}` : '(Manual Ink Signature)';
      doc.text(signeeText, custColX + 3.0, currentY + 17.0);
    } else {
      // Digital certification
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text(resolvedCustomSignature.name || 'Authorized Signatory', custColX + 3.0, currentY + 11.5);

      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(custColX + 3.0, currentY + 13.0, custColX + colW - 3.0, currentY + 13.0);
      doc.setLineDashPattern([], 0);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Signee:  ${resolvedCustomSignature.name || 'Authorized Signatory'}`, custColX + 3.0, currentY + 17.0);
    }

    const custDate = resolvedCustomSignature.date || lastWorkingDayDate;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${custDate}`, custColX + 3.0, currentY + 21.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('VERIFIED', custColX + colW - 3.0, currentY + 21.5, { align: 'right' });

    currentY += boxH + 2;

    if (resolvedCustomSignature.statement) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      const splitNote = doc.splitTextToSize(`Audit Note: "${resolvedCustomSignature.statement}"`, pageWidth - marginX * 2);
      doc.text(splitNote[0], marginX, currentY + 3);
      currentY += 5;
    }

    currentY += 2;
  } else {
    // Default 2 signature columns
    const sigColWidth = (pageWidth - marginX * 2 - 12) / 2;
    const boxH = 25;

    // Employee Sign Box
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginX, currentY, sigColWidth, boxH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('EMPLOYEE CERTIFICATION', marginX + 3.0, currentY + 4.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(profile.employeeName, marginX + 3.0, currentY + 11.5);

    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginX + 3.0, currentY + 13.0, marginX + sigColWidth - 3.0, currentY + 13.0);
    doc.setLineDashPattern([], 0); // reset

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Sign: ${profile.employeeName}`, marginX + 3.0, currentY + 17.0);
    doc.text(`Date: ${lastWorkingDayDate}`, marginX + 3.0, currentY + 21.5);

    // Supervisor Sign Box
    const supColX = marginX + sigColWidth + 12;
    doc.setDrawColor(203, 213, 225);
    doc.rect(supColX, currentY, sigColWidth, boxH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('SUPERVISOR AUTHORIZATION', supColX + 3.0, currentY + 4.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(profile.supervisorName, supColX + 3.0, currentY + 11.5);

    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(supColX + 3.0, currentY + 13.0, supColX + sigColWidth - 3.0, currentY + 13.0);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Approver: ${profile.supervisorName}`, supColX + 3.0, currentY + 17.0);
    doc.text('Status: APPROVED', supColX + 3.0, currentY + 21.5);
    doc.text(`Date: ${lastWorkingDayDate}`, supColX + sigColWidth - 3.0, currentY + 21.5, { align: 'right' });

    currentY += boxH + 4;
  }

  // Professional, consistent audit footer on every page with page numbering.
  const pageCount = doc.getNumberOfPages();
  const generatedLabel = generatedAt.toLocaleString();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Demontigny Carpentry · Timesheet Audit · ${period.startDate} to ${period.endDate}`,
      marginX,
      pageHeight - 8
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated ${generatedLabel} · Page ${page} of ${pageCount}`,
      pageWidth - marginX,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc;
}
