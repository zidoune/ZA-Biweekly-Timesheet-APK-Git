import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { DayOff, ManagedEmployee, Project, TimeEntry, TimesheetProfile } from '../types/timesheet';

/**
 * User Profile Firestore Functions
 */
export function subscribeUserProfile(
  userId: string,
  onData: (profile: TimesheetProfile | null) => void
): Unsubscribe {
  const path = `users/${userId}`;
  const docRef = doc(db, 'users', userId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const profile: TimesheetProfile = {
          employeeName: data.employeeName || '',
          employeeEmail: data.employeeEmail || '',
          employeePhone: data.employeePhone || '',
          employerName: data.employerName || '',
          employerPhone: data.employerPhone || '',
          employeeId: data.employeeId || 'EMP-001',
          title: data.title || '',
          department: data.department || '',
          supervisorName: data.supervisorName || '',
          targetWorkingDays: Number(data.targetWorkingDays ?? 10),
          dailyStandardHours: Number(data.dailyStandardHours ?? 8.0),
          defaultBreakMinutes: Number(data.defaultBreakMinutes ?? 30),
          currencySymbol: data.currencySymbol || '$',
          defaultHourlyRate: Number(data.defaultHourlyRate ?? 95),
          overtimeThreshold: Number(data.overtimeThreshold ?? 80),
          overtimeRateMultiplier: Number(data.overtimeRateMultiplier ?? 1.5),
          contractorPermissions: Boolean(data.contractorPermissions ?? true),
          isContractor: Boolean(data.isContractor ?? true),
          role: data.role || 'contractor',
        };
        onData(profile);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserProfile(
  userId: string,
  profile: TimesheetProfile
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(
      docRef,
      {
        id: userId,
        userId,
        employeeName: profile.employeeName,
        employeeEmail: profile.employeeEmail,
        employeePhone: profile.employeePhone,
        employerName: profile.employerName,
        employerPhone: profile.employerPhone,
        employeeId: profile.employeeId || 'EMP-001',
        title: profile.title,
        department: profile.department,
        supervisorName: profile.supervisorName,
        targetWorkingDays: profile.targetWorkingDays,
        dailyStandardHours: profile.dailyStandardHours,
        defaultBreakMinutes: profile.defaultBreakMinutes,
        currencySymbol: profile.currencySymbol,
        defaultHourlyRate: profile.defaultHourlyRate,
        overtimeThreshold: profile.overtimeThreshold,
        overtimeRateMultiplier: profile.overtimeRateMultiplier,
        contractorPermissions: profile.contractorPermissions ?? true,
        isContractor: profile.isContractor ?? true,
        role: profile.role || 'contractor',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Managed Employees Firestore Functions
 */
export function subscribeManagedEmployees(
  userId: string,
  onData: (employees: ManagedEmployee[]) => void
): Unsubscribe {
  const path = `users/${userId}/managedEmployees`;
  const colRef = collection(db, 'users', userId, 'managedEmployees');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const employees: ManagedEmployee[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          employeeId: data.employeeId || d.id,
          employeeName: data.employeeName || '',
          employeeEmail: data.employeeEmail || '',
          employeePhone: data.employeePhone || '',
          title: data.title || '',
          department: data.department || '',
          supervisorName: data.supervisorName || '',
          defaultHourlyRate: Number(data.defaultHourlyRate ?? 85),
          dailyStandardHours: Number(data.dailyStandardHours ?? 8.0),
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });
      onData(employees);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveManagedEmployee(
  userId: string,
  employee: ManagedEmployee
): Promise<void> {
  const path = `users/${userId}/managedEmployees/${employee.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'managedEmployees', employee.id);
    await setDoc(docRef, {
      id: employee.id,
      userId,
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      employeeEmail: employee.employeeEmail || '',
      employeePhone: employee.employeePhone || '',
      title: employee.title || '',
      department: employee.department || '',
      supervisorName: employee.supervisorName || '',
      defaultHourlyRate: employee.defaultHourlyRate ?? 85,
      dailyStandardHours: employee.dailyStandardHours ?? 8.0,
      notes: employee.notes || '',
      createdAt: employee.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteManagedEmployee(
  userId: string,
  employeeDocId: string
): Promise<void> {
  const path = `users/${userId}/managedEmployees/${employeeDocId}`;
  try {
    const docRef = doc(db, 'users', userId, 'managedEmployees', employeeDocId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Projects Firestore Functions
 */
export function subscribeProjects(
  userId: string,
  onData: (projects: Project[]) => void
): Unsubscribe {
  const path = `users/${userId}/projects`;
  const colRef = collection(db, 'users', userId, 'projects');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const projects: Project[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          client: data.client || '',
          code: data.code || '',
          color: data.color || '#2563EB',
          colorCode: data.colorCode || data.tagColor || data.color || '#2563EB',
          tagColor: data.tagColor || data.colorCode || data.color || '#2563EB',
          billable: Boolean(data.billable ?? true),
          rate: Number(data.rate ?? 95),
        };
      });
      onData(projects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveProject(
  userId: string,
  project: Project
): Promise<void> {
  const path = `users/${userId}/projects/${project.id}`;
  const effectiveColor = project.tagColor || project.colorCode || project.color || '#2563EB';
  try {
    const docRef = doc(db, 'users', userId, 'projects', project.id);
    await setDoc(docRef, {
      id: project.id,
      userId,
      name: project.name,
      client: project.client || '',
      code: project.code,
      color: effectiveColor,
      colorCode: effectiveColor,
      tagColor: effectiveColor,
      billable: project.billable,
      rate: project.rate,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProject(
  userId: string,
  projectId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Time Entries Firestore Functions
 */
export function subscribeEntries(
  userId: string,
  onData: (entries: TimeEntry[]) => void
): Unsubscribe {
  const path = `users/${userId}/entries`;
  const colRef = collection(db, 'users', userId, 'entries');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const entries: TimeEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date,
          projectId: data.projectId,
          startTime: data.startTime,
          endTime: data.endTime,
          breakMinutes: Number(data.breakMinutes ?? 0),
          netHours: Number(data.netHours ?? 0),
          notes: data.notes || '',
          employeeId: data.employeeId || undefined,
        };
      });
      onData(entries);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveEntry(
  userId: string,
  entry: TimeEntry
): Promise<void> {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'entries', entry.id);
    await setDoc(docRef, {
      id: entry.id,
      userId,
      date: entry.date,
      projectId: entry.projectId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      netHours: entry.netHours,
      notes: entry.notes || '',
      employeeId: entry.employeeId || 'EMP-001',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Days Off Firestore Functions
 */
export function subscribeDaysOff(
  userId: string,
  onData: (daysOff: DayOff[]) => void
): Unsubscribe {
  const path = `users/${userId}/daysOff`;
  const colRef = collection(db, 'users', userId, 'daysOff');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const daysOff: DayOff[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date,
          reason: data.reason || 'Day off',
          notes: data.notes || '',
          isDidNotWork: Boolean(data.isDidNotWork),
          isPaid: Boolean(data.isPaid),
        };
      });
      onData(daysOff);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveDayOff(
  userId: string,
  dayOff: DayOff
): Promise<void> {
  const dayOffId = dayOff.id || dayOff.date;
  const path = `users/${userId}/daysOff/${dayOffId}`;
  try {
    const docRef = doc(db, 'users', userId, 'daysOff', dayOffId);
    await setDoc(docRef, {
      id: dayOffId,
      userId,
      date: dayOff.date,
      reason: dayOff.reason || '',
      notes: dayOff.notes || '',
      isDidNotWork: Boolean(dayOff.isDidNotWork),
      isPaid: Boolean(dayOff.isPaid),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDayOff(
  userId: string,
  dayOffId: string
): Promise<void> {
  const path = `users/${userId}/daysOff/${dayOffId}`;
  try {
    const docRef = doc(db, 'users', userId, 'daysOff', dayOffId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Bootstrap / Seed user data if Firestore collections are empty for a newly registered user
 */
export async function initializeUserDataIfEmpty(
  userId: string,
  defaultProfile: TimesheetProfile,
  defaultProjects: Project[],
  defaultEntries: TimeEntry[],
  defaultDaysOff: DayOff[]
): Promise<void> {
  const userDocPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      // Initialize profile
      await saveUserProfile(userId, defaultProfile);

      // Seed initial projects
      for (const prj of defaultProjects) {
        await saveProject(userId, prj);
      }

      // Seed initial entries
      for (const entry of defaultEntries) {
        await saveEntry(userId, entry);
      }

      // Seed initial days off
      for (const dOff of defaultDaysOff) {
        await saveDayOff(userId, dOff);
      }
    } else {
      // Check if projects subcollection is empty
      const projSnap = await getDocs(collection(db, 'users', userId, 'projects'));
      if (projSnap.empty) {
        for (const prj of defaultProjects) {
          await saveProject(userId, prj);
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }
}
