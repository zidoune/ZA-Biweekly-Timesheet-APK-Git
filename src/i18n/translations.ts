export type Language = 'en' | 'fr';

export interface Translations {
  // General & Brand
  appTitle: string;
  appSubtitle: string;
  cycleInfo: string;
  language: string;
  selectLanguage: string;
  english: string;
  french: string;

  // Header & Nav
  period: string;
  periodNumber: string;
  previousPeriod: string;
  nextPeriod: string;
  projectsBtn: string;
  settingsBtn: string;
  exportPdfBtn: string;
  mobileAppBtn: string;
  mobileAppModalTitle: string;
  installAppBtn: string;
  installedNotice: string;
  headerOvertimeBadge: string;
  headerOvertimeThresholdExceeded: string;
  headerOvertimeNotice: string;
  headerOvertimeSurplus: string;
  signInWithGoogle: string;
  signOut: string;
  signedInAs: string;
  firestoreConnected: string;
  syncingWithCloud: string;
  cloudSyncNotice: string;

  // Theme
  theme: string;
  themeLight: string;
  themeDark: string;
  themeToggle: string;

  // Employee details header
  employeeDetails: string;
  employeeName: string;
  employeePhone: string;
  employerName: string;
  employerPhone: string;
  clientName: string;
  changeClientName: string;
  applyToAllProjects: string;
  activeClientBanner: string;
  employeeEmail: string;
  baseHourlyRate: string;
  targetWorkdays: string;
  dailyHours: string;

  // Summary cards
  regularHours: string;
  targetLabel: string;
  totalHoursWorked: string;
  netWorkedTime: string;
  totalPaymentTitle: string; // "Total Payment based on Total hours of work and base rates"
  totalBreaks: string;
  totalBreaksSub: string;
  daysOffCount: string;
  daysOffSub: string;
  billableHoursLabel: string;
  overtimeHoursLabel: string;

  // Period Summary Chart
  chartTitle: string;
  chartSubtitle: string;
  chartWorkedHours: string;
  chartStandardTarget: string;
  chartVariance: string;
  chartTargetMet: string;
  chartAllDays: string;
  showChartBtn: string;
  hideChartBtn: string;

  // Weekly Breakdown & Reconciliation
  firstWeek: string;
  secondWeek: string;
  weeklyReconciliation: string;
  weeklyBreakdownSubtitle: string;
  week1Label: string;
  week2Label: string;
  reconciliationSummary: string;
  weeklyTarget: string;
  weeklyVariance: string;
  weeklyGrossPay: string;

  // Total Hours Tooltip Breakdown (80-Hour Threshold)
  hoursBreakdownTitle: string;
  biweekly80hThreshold: string;
  regularHours80Label: string;
  potentialOt80Label: string;
  remainingTo80hLabel: string;
  otTriggeredNotice: string;
  standardBiweeklyCapNotice: string;

  // Live Timer Bar
  liveClock: string;
  activeTimer: string;
  startTimer: string;
  stopTimer: string;
  selectProject: string;
  elapsedTime: string;

  // Timesheet Grid
  week1: string;
  week2: string;
  workday: string;
  weekend: string;
  dayOffBadge: string;
  didNotWorkBadge: string;
  makeDayOffBtn: string;
  didNotWorkBtn: string;
  restoreWorkdayBtn: string;
  editStatusBtn: string;
  addEntryBtn: string;
  noEntriesLogged: string;
  mealBreakLabel: string;
  startHeader: string;
  endHeader: string;
  breakHeader: string;
  netHeader: string;
  totalDayHours: string;
  hoursUnit: string;
  minUnit: string;
  hoursAndMin: string;

  // Day Off Modal
  makeDayOffTitle: string;
  markDidNotWorkTitle: string;
  editDayStatusTitle: string;
  dayStatusLabel: string;
  statusDayOffLeave: string;
  statusDidNotWork: string;
  statusDidNotWorkHint: string;
  cannotMarkTodayDidNotWork: string;
  reasonLabel: string;
  notesLabel: string;
  paidLeaveCheckbox: string;
  saveStatusBtn: string;
  removeDayOffBtn: string;
  cancelBtn: string;

  // Entry Modal
  logEntryTitle: string;
  editEntryTitle: string;
  projectSiteLabel: string;
  timeInLabel: string;
  timeOutLabel: string;
  mealBreakMinHoursLabel: string; // Meal Breaks (hours and Min)
  taskDescriptionLabel: string;
  saveEntryBtn: string;
  deleteEntryBtn: string;

  // Projects Modal
  projectsTitle: string;
  addProjectTitle: string;
  projectName: string;
  projectCode: string;
  hourlyRate: string;
  saveProject: string;

  // Settings Modal
  settingsTitle: string;
  saveSettings: string;
  overtimeThresholdLabel: string;
  overtimeThresholdHelp: string;
  overtimeMultiplierLabel: string;
  overtimeMultiplierHelp: string;
  enterTimesheetForAnotherEmployee: string;
  employeeIdLabel: string;
  uniqueEmployeeId: string;
  uniqueEmployeeIdHelp: string;
  contractorPermissionsLabel: string;
  contractorPermissionsHelp: string;
  backToMyTimesheet: string;
  delegatingNotice: string;

  // PDF Audit Modal
  pdfModalTitle: string;
  downloadPdfBtn: string;
  printAuditBtn: string;
  closeBtn: string;
  periodAuditTotal: string;
  pdfExportOptionsTitle: string;
  toggleProjectNotes: string;
  toggleProjectNotesHelp: string;
  selectAllProjects: string;
  deselectAllProjects: string;
  addCustomSignature: string;
  addCustomSignatureHelp: string;
  customSigRoleLabel: string;
  customSigNameLabel: string;
  customSigDateLabel: string;
  customSigStatementLabel: string;
  manualInkSignature: string;
  digitalVerifiedSignature: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Chronos',
    appSubtitle: 'Biweekly Audit',
    cycleInfo: '14-Day Cycle · 10 Workdays',
    language: 'Language',
    selectLanguage: 'Select Language',
    english: 'English',
    french: 'Français',

    period: 'Period',
    periodNumber: 'Period #',
    previousPeriod: 'Previous Biweekly Period',
    nextPeriod: 'Next Biweekly Period',
    projectsBtn: 'Projects',
    settingsBtn: 'Settings',
    exportPdfBtn: 'Export PDF Audit',
    mobileAppBtn: 'Mobile & APK',
    mobileAppModalTitle: 'Mobile App & Android APK',
    installAppBtn: 'Install App (WebAPK)',
    installedNotice: 'App Installed & Running Standalone',
    headerOvertimeBadge: 'Overtime Active',
    headerOvertimeThresholdExceeded: '80h Threshold Exceeded',
    headerOvertimeNotice: 'Total period hours exceed the 80.0-hour biweekly threshold.',
    headerOvertimeSurplus: 'overtime surplus',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    signedInAs: 'Signed in as',
    firestoreConnected: 'Cloud Synced',
    syncingWithCloud: 'Syncing to Firestore...',
    cloudSyncNotice: 'Real-time Firestore database persistence active',

    theme: 'Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeToggle: 'Toggle Light / Dark Mode',

    employeeDetails: 'Employee Details',
    employeeName: 'Employee name:',
    employeePhone: 'Employee Phone:',
    employerName: 'Client / Employer Name:',
    employerPhone: 'Client / Employer Phone:',
    clientName: 'Client Name',
    changeClientName: 'Change Client Name',
    applyToAllProjects: 'Apply to All Projects & Header',
    activeClientBanner: 'Primary Client:',
    employeeEmail: 'Employee Email:',
    baseHourlyRate: 'Base Hourly Rate:',
    targetWorkdays: 'Target Workdays:',
    dailyHours: 'Standard Daily Hours:',

    regularHours: 'Regular Hours',
    targetLabel: 'Target',
    totalHoursWorked: 'Total Worked Hours',
    netWorkedTime: 'Net productive on-site time',
    totalPaymentTitle: 'Gross Pay calculated as Total Hours × Base Hourly Rate',
    totalBreaks: 'Total Meal Breaks',
    totalBreaksSub: 'Unpaid lunch & rest intervals',
    daysOffCount: 'Days Off & Leaves',
    daysOffSub: 'Non-working days accounted',
    billableHoursLabel: 'Billable Hours',
    overtimeHoursLabel: 'Overtime Hours',

    chartTitle: 'Daily Hours Worked vs. Standard 8h Target',
    chartSubtitle: 'Daily breakdown across 14-day pay period compared against 8.0h workday baseline',
    chartWorkedHours: 'Hours Worked',
    chartStandardTarget: '8h Standard Target',
    chartVariance: 'Variance',
    chartTargetMet: 'Target Met',
    chartAllDays: 'All 14 Days',
    showChartBtn: 'Show Daily Hours Chart',
    hideChartBtn: 'Hide Daily Hours Chart',

    // Weekly Breakdown & Reconciliation
    firstWeek: 'First Week',
    secondWeek: 'Second Week',
    weeklyReconciliation: 'Weekly Hours Reconciliation',
    weeklyBreakdownSubtitle: 'First Week vs. Second Week comparison for payroll accounting',
    week1Label: 'First Week (Days 1–7)',
    week2Label: 'Second Week (Days 8–14)',
    reconciliationSummary: 'Biweekly Reconciliation Summary',
    weeklyTarget: 'Target',
    weeklyVariance: 'Variance',
    weeklyGrossPay: 'Gross Pay',

    hoursBreakdownTitle: 'Biweekly Hours Breakdown',
    biweekly80hThreshold: '80-Hour Biweekly Threshold',
    regularHours80Label: 'Regular Hours (≤ 80h)',
    potentialOt80Label: 'Potential Overtime (> 80h)',
    remainingTo80hLabel: 'Remaining to 80h threshold',
    otTriggeredNotice: 'Overtime threshold reached! Hours above 80h qualify for OT rates.',
    standardBiweeklyCapNotice: 'Standard 80-hour biweekly threshold across 10 workdays (8 hrs/day).',

    liveClock: 'Live Clock',
    activeTimer: 'Active Timer',
    startTimer: 'Start Timer',
    stopTimer: 'Stop & Log',
    selectProject: 'Select Job / Project',
    elapsedTime: 'Elapsed',

    week1: 'Week 1',
    week2: 'Week 2',
    workday: 'Workday',
    weekend: 'Weekend',
    dayOffBadge: 'Day Off',
    didNotWorkBadge: "Didn't work",
    makeDayOffBtn: 'Make Day Off',
    didNotWorkBtn: "Didn't work",
    restoreWorkdayBtn: 'Restore Workday',
    editStatusBtn: 'Edit Status',
    addEntryBtn: 'Add Entry',
    noEntriesLogged: 'No time entries recorded for this date.',
    mealBreakLabel: 'Meal Break',
    startHeader: 'Time In',
    endHeader: 'Time Out',
    breakHeader: 'Meal Break',
    netHeader: 'Net Hours',
    totalDayHours: 'Day Total',
    hoursUnit: 'h',
    minUnit: 'm',
    hoursAndMin: 'hours and Min',

    makeDayOffTitle: 'Make Working Day as Day Off',
    markDidNotWorkTitle: "Mark Day as Didn't Work",
    editDayStatusTitle: 'Modify Day Status',
    dayStatusLabel: 'Day Status Type',
    statusDayOffLeave: 'Day Off / Leave',
    statusDidNotWork: "Didn't Work",
    statusDidNotWorkHint: "Mark this date as unworked (absent, weather, or standdown).",
    cannotMarkTodayDidNotWork: "Current day in progress cannot be marked as didn't work.",
    reasonLabel: 'Reason / Classification',
    notesLabel: 'Notes / Supervisor Comments',
    paidLeaveCheckbox: 'Paid Leave (covers standard 8h base wage)',
    saveStatusBtn: 'Save Day Status',
    removeDayOffBtn: 'Clear & Restore Normal Workday',
    cancelBtn: 'Cancel',

    logEntryTitle: 'Log Time Entry',
    editEntryTitle: 'Edit Time Entry',
    projectSiteLabel: 'Project / Job Site',
    timeInLabel: 'Time In',
    timeOutLabel: 'Time Out',
    mealBreakMinHoursLabel: 'Meal Breaks (hours and Min)',
    taskDescriptionLabel: 'Task Description / Work Notes',
    saveEntryBtn: 'Save Entry',
    deleteEntryBtn: 'Delete Entry',

    projectsTitle: 'Project & Site Management',
    addProjectTitle: 'Add New Project / Site',
    projectName: 'Project Name',
    projectCode: 'Code / Site ID',
    hourlyRate: 'Hourly Rate ($)',
    saveProject: 'Save Project',

    settingsTitle: 'Personnel & Timesheet Settings',
    saveSettings: 'Save Settings',
    overtimeThresholdLabel: 'Overtime Threshold',
    overtimeThresholdHelp: 'Biweekly hours triggering overtime pay calculations (e.g., 80 hrs)',
    overtimeMultiplierLabel: 'Overtime Pay Multiplier',
    overtimeMultiplierHelp: 'Rate multiplier applied to hours exceeding threshold (e.g., 1.5x)',
    enterTimesheetForAnotherEmployee: 'Enter Timesheet for Another Employee',
    employeeIdLabel: 'Employee ID',
    uniqueEmployeeId: 'Unique Employee ID',
    uniqueEmployeeIdHelp: 'Each added Employee will have a unique ID.',
    contractorPermissionsLabel: 'Contractor Permissions',
    contractorPermissionsHelp: 'Authorized to enter timesheets and log hours for crew members',
    backToMyTimesheet: 'Back to My Timesheet',
    delegatingNotice: 'Entering timesheet on behalf of',

    pdfModalTitle: 'Biweekly Timesheet & Payroll Audit Preview',
    downloadPdfBtn: 'Download Audit PDF',
    printAuditBtn: 'Print Timesheet',
    closeBtn: 'Close',
    periodAuditTotal: 'PERIOD AUDIT TOTAL:',
    pdfExportOptionsTitle: 'Audit PDF Customization & Compliance Options',
    toggleProjectNotes: 'Include Project & Work Notes',
    toggleProjectNotesHelp: 'Display task logs, punch notes, and project scopes under each daily punch entry',
    selectAllProjects: 'Select All',
    deselectAllProjects: 'Deselect All',
    addCustomSignature: 'Add Custom Signature Line',
    addCustomSignatureHelp: 'Insert a 3rd authorization block for Client Acceptance, GC sign-off, or Inspector verification',
    customSigRoleLabel: 'Sign-off Role / Header',
    customSigNameLabel: 'Signee / Approver Full Name',
    customSigDateLabel: 'Date of Authorization',
    customSigStatementLabel: 'Compliance Statement',
    manualInkSignature: 'Physical Ink Signature Line (X ____________)',
    digitalVerifiedSignature: 'Digital Stamp Verification',
  },
  fr: {
    appTitle: 'Chronos',
    appSubtitle: 'Audit Bimensuel',
    cycleInfo: 'Cycle de 14 jours · 10 jours ouvrés',
    language: 'Langue',
    selectLanguage: 'Choisir la langue',
    english: 'English',
    french: 'Français',

    period: 'Période',
    periodNumber: 'Période n°',
    previousPeriod: 'Période bimensuelle précédente',
    nextPeriod: 'Période bimensuelle suivante',
    projectsBtn: 'Projets',
    settingsBtn: 'Paramètres',
    exportPdfBtn: 'Exporter Audit PDF',
    mobileAppBtn: 'Mobile & APK',
    mobileAppModalTitle: 'Application Mobile & APK Android',
    installAppBtn: 'Installer l\'application (WebAPK)',
    installedNotice: 'Application installée en mode autonome',
    headerOvertimeBadge: 'Heures sup. actives',
    headerOvertimeThresholdExceeded: 'Seuil de 80h dépassé',
    headerOvertimeNotice: 'Le total des heures de la période dépasse le seuil bimensuel de 80,0 h.',
    headerOvertimeSurplus: 'surplus supplémentaire',
    signInWithGoogle: 'Connexion Google',
    signOut: 'Déconnexion',
    signedInAs: 'Connecté en tant que',
    firestoreConnected: 'Synchronisé Cloud',
    syncingWithCloud: 'Synchronisation Firestore...',
    cloudSyncNotice: 'Base de données Firestore temps réel active',

    theme: 'Thème',
    themeLight: 'Mode clair',
    themeDark: 'Mode sombre',
    themeToggle: 'Basculer clair / sombre',

    employeeDetails: "Détails de l'employé",
    employeeName: "Nom de l'employé :",
    employeePhone: "Téléphone de l'employé :",
    employerName: "Nom du client / employeur :",
    employerPhone: "Téléphone client / employeur :",
    clientName: "Nom du client",
    changeClientName: "Modifier le nom du client",
    applyToAllProjects: "Appliquer à tous les projets et en-tête",
    activeClientBanner: "Client principal :",
    employeeEmail: "Courriel de l'employé :",
    baseHourlyRate: 'Taux horaire de base :',
    targetWorkdays: 'Jours ouvrés cibles :',
    dailyHours: 'Heures journalières standard :',

    regularHours: 'Heures régulières',
    targetLabel: 'Objectif',
    totalHoursWorked: 'Total des heures travaillées',
    netWorkedTime: 'Temps net productif sur site',
    totalPaymentTitle: 'Salaire brut calculé : Heures totales × Taux horaire de base',
    totalBreaks: 'Total des pauses repas',
    totalBreaksSub: 'Intervalles repas et repos non rémunérés',
    daysOffCount: 'Jours de repos et congés',
    daysOffSub: 'Jours non travaillés comptabilisés',
    billableHoursLabel: 'Heures facturables',
    overtimeHoursLabel: 'Heures supplémentaires',

    chartTitle: 'Heures quotidiennes travaillées vs Objectif standard (8h)',
    chartSubtitle: 'Répartition sur les 14 jours de la période comparée à la base de 8,0h par jour ouvré',
    chartWorkedHours: 'Heures travaillées',
    chartStandardTarget: 'Objectif standard 8h',
    chartVariance: 'Écart',
    chartTargetMet: 'Objectif atteint',
    chartAllDays: '14 Jours complets',
    showChartBtn: 'Afficher le graphique des heures',
    hideChartBtn: 'Masquer le graphique des heures',

    // Weekly Breakdown & Reconciliation
    firstWeek: 'Première semaine',
    secondWeek: 'Deuxième semaine',
    weeklyReconciliation: 'Rapprochement hebdomadaire des heures',
    weeklyBreakdownSubtitle: 'Comparaison de la 1ère et 2ème semaine pour la paie',
    week1Label: 'Première semaine (Jours 1–7)',
    week2Label: 'Deuxième semaine (Jours 8–14)',
    reconciliationSummary: 'Synthèse du rapprochement bimensuel',
    weeklyTarget: 'Objectif',
    weeklyVariance: 'Écart',
    weeklyGrossPay: 'Salaire brut',

    hoursBreakdownTitle: 'Répartition des heures bimensuelles',
    biweekly80hThreshold: 'Seuil bimensuel de 80 heures',
    regularHours80Label: 'Heures régulières (≤ 80h)',
    potentialOt80Label: 'Heures supplémentaires potentielles (> 80h)',
    remainingTo80hLabel: 'Restant avant le seuil de 80h',
    otTriggeredNotice: 'Seuil atteint ! Les heures au-delà de 80h sont admissibles aux taux supplémentaires.',
    standardBiweeklyCapNotice: 'Seuil standard de 80 heures sur 10 jours ouvrés (8 h/jour).',

    liveClock: 'Horloge en direct',
    activeTimer: 'Chronomètre actif',
    startTimer: 'Démarrer le chronomètre',
    stopTimer: 'Arrêter et enregistrer',
    selectProject: 'Sélectionner chantier / projet',
    elapsedTime: 'Écoulé',

    week1: 'Semaine 1',
    week2: 'Semaine 2',
    workday: 'Jour ouvré',
    weekend: 'Fin de semaine',
    dayOffBadge: 'Jour de repos',
    didNotWorkBadge: "N'a pas travaillé",
    makeDayOffBtn: 'Marquer repos',
    didNotWorkBtn: "N'a pas travaillé",
    restoreWorkdayBtn: 'Rétablir jour ouvré',
    editStatusBtn: 'Modifier statut',
    addEntryBtn: 'Ajouter une entrée',
    noEntriesLogged: 'Aucune heure enregistrée pour cette date.',
    mealBreakLabel: 'Pause repas',
    startHeader: 'Heure début',
    endHeader: 'Heure fin',
    breakHeader: 'Pause repas',
    netHeader: 'Heures nettes',
    totalDayHours: 'Total journée',
    hoursUnit: 'h',
    minUnit: 'min',
    hoursAndMin: 'heures et min',

    makeDayOffTitle: 'Marquer le jour ouvré comme jour de repos',
    markDidNotWorkTitle: "Marquer le jour comme n'ayant pas travaillé",
    editDayStatusTitle: 'Modifier le statut de la journée',
    dayStatusLabel: 'Type de statut',
    statusDayOffLeave: 'Jour de repos / Congé',
    statusDidNotWork: "N'a pas travaillé",
    statusDidNotWorkHint: "Marquer cette date comme non travaillée (absence, météo ou arrêt chantier).",
    cannotMarkTodayDidNotWork: "La journée en cours ne peut pas être marquée comme non travaillée.",
    reasonLabel: 'Motif / Classification',
    notesLabel: 'Notes / Commentaires du superviseur',
    paidLeaveCheckbox: 'Congé payé (couvre le salaire de base standard de 8h)',
    saveStatusBtn: 'Enregistrer le statut',
    removeDayOffBtn: 'Effacer et rétablir en jour ouvré',
    cancelBtn: 'Annuler',

    logEntryTitle: 'Enregistrer des heures',
    editEntryTitle: "Modifier l'entrée",
    projectSiteLabel: 'Projet / Chantier',
    timeInLabel: 'Heure début',
    timeOutLabel: 'Heure fin',
    mealBreakMinHoursLabel: 'Pauses repas (heures et min)',
    taskDescriptionLabel: 'Description des tâches / Notes',
    saveEntryBtn: "Enregistrer l'entrée",
    deleteEntryBtn: "Supprimer l'entrée",

    projectsTitle: 'Gestion des projets et chantiers',
    addProjectTitle: 'Ajouter un nouveau projet / chantier',
    projectName: 'Nom du projet',
    projectCode: 'Code / Identifiant chantier',
    hourlyRate: 'Taux horaire ($)',
    saveProject: 'Enregistrer le projet',

    settingsTitle: "Paramètres de l'employé et de la feuille",
    saveSettings: 'Enregistrer les paramètres',
    overtimeThresholdLabel: 'Seuil des heures supplémentaires',
    overtimeThresholdHelp: 'Heures bimensuelles déclenchant le calcul des heures sup (ex. 80 h)',
    overtimeMultiplierLabel: 'Multiplicateur des heures sup',
    overtimeMultiplierHelp: 'Coefficient appliqué aux heures au-delà du seuil (ex. 1,5x)',
    enterTimesheetForAnotherEmployee: 'Saisir la feuille de temps pour un autre employé',
    employeeIdLabel: "Identifiant de l'employé",
    uniqueEmployeeId: "Identifiant unique de l'employé",
    uniqueEmployeeIdHelp: 'Chaque employé ajouté aura un identifiant unique.',
    contractorPermissionsLabel: 'Autorisations du contractant',
    contractorPermissionsHelp: 'Autorisé à saisir des feuilles de temps et consigner des heures pour l\'équipe',
    backToMyTimesheet: 'Retour à ma feuille de temps',
    delegatingNotice: 'Saisie de la feuille de temps pour le compte de',

    pdfModalTitle: 'Aperçu et audit de la feuille de temps bimensuelle',
    downloadPdfBtn: 'Télécharger le PDF',
    printAuditBtn: 'Imprimer la feuille',
    closeBtn: 'Fermer',
    periodAuditTotal: 'TOTAL AUDIT DE LA PÉRIODE :',
    pdfExportOptionsTitle: 'Options de personnalisation et conformité du PDF',
    toggleProjectNotes: 'Inclure les notes de projet et tâches',
    toggleProjectNotesHelp: 'Afficher les notes de travail et descriptions de projet sous chaque pointage journalier',
    selectAllProjects: 'Tout sélectionner',
    deselectAllProjects: 'Tout désélectionner',
    addCustomSignature: 'Ajouter une ligne de signature personnalisée',
    addCustomSignatureHelp: 'Insère un 3e bloc d\'autorisation pour l\'acceptation client, l\'entrepreneur général ou l\'inspecteur',
    customSigRoleLabel: 'Titre / Rôle du signataire',
    customSigNameLabel: 'Nom complet du signataire / approbateur',
    customSigDateLabel: 'Date d\'autorisation',
    customSigStatementLabel: 'Déclaration de conformité',
    manualInkSignature: 'Ligne pour signature manuelle à l\'encre (X ____________)',
    digitalVerifiedSignature: 'Vérification par cachet numérique',
  },
};
