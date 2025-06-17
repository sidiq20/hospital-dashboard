import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  arrayUnion,
  runTransaction,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient, Ward, User, DashboardStats, PatientNote, Appointment, ProcedureAnalytics } from '@/types';

// Patients
export const createPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const patientData = {
      ...patient,
      notes: [],
      appointments: [],
      procedureStatus: patient.procedure ? 'pending' : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // If no ward is assigned or patient is not admitted, create patient directly
    if (!patient.wardId || patient.status !== 'admitted') {
      const docRef = await addDoc(collection(db, 'patients'), patientData);
      return docRef.id;
    }
    
    // Use transaction for ward occupancy update
    return await runTransaction(db, async (transaction) => {
      // Check if ward exists and has available beds
      const wardRef = doc(db, 'wards', patient.wardId!);
      const wardDoc = await transaction.get(wardRef);
      
      if (!wardDoc.exists()) {
        throw new Error('Selected ward does not exist');
      }
      
      const wardData = wardDoc.data() as Ward;
      const newOccupiedBeds = wardData.occupiedBeds + 1;
      
      // Check if ward has available beds
      if (newOccupiedBeds > wardData.totalBeds) {
        throw new Error(`Ward ${wardData.name} is at full capacity (${wardData.totalBeds}/${wardData.totalBeds} beds occupied)`);
      }
      
      // Create patient document
      const patientRef = doc(collection(db, 'patients'));
      transaction.set(patientRef, patientData);
      
      // Update ward occupancy
      transaction.update(wardRef, {
        occupiedBeds: newOccupiedBeds
      });
      
      return patientRef.id;
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

export const getPatient = async (id: string): Promise<Patient | null> => {
  try {
    const docRef = doc(db, 'patients', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        // Ensure dates are properly converted
        admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
        dischargeDate: data.dischargeDate?.toDate ? data.dischargeDate.toDate() : data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        procedureDate: data.procedureDate?.toDate ? data.procedureDate.toDate() : data.procedureDate ? new Date(data.procedureDate) : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        // Ensure notes and appointments arrays exist and convert dates
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          createdAt: note.createdAt?.toDate ? note.createdAt.toDate() : new Date(note.createdAt)
        })),
        appointments: (data.appointments || []).map((apt: any) => ({
          ...apt,
          scheduledDate: apt.scheduledDate?.toDate ? apt.scheduledDate.toDate() : new Date(apt.scheduledDate),
          createdAt: apt.createdAt?.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt)
        }))
      } as Patient;
    }
    return null;
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'patients'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // Ensure dates are properly converted
        admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
        dischargeDate: data.dischargeDate?.toDate ? data.dischargeDate.toDate() : data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        procedureDate: data.procedureDate?.toDate ? data.procedureDate.toDate() : data.procedureDate ? new Date(data.procedureDate) : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        // Ensure notes and appointments arrays exist and convert dates
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          createdAt: note.createdAt?.toDate ? note.createdAt.toDate() : new Date(note.createdAt)
        })),
        appointments: (data.appointments || []).map((apt: any) => ({
          ...apt,
          scheduledDate: apt.scheduledDate?.toDate ? apt.scheduledDate.toDate() : new Date(apt.scheduledDate),
          createdAt: apt.createdAt?.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt)
        }))
      };
    }) as Patient[];
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const docRef = doc(db, 'patients', id);
      
      // Get current patient data to check for ward changes
      const currentPatientDoc = await transaction.get(docRef);
      if (!currentPatientDoc.exists()) {
        throw new Error('Patient not found');
      }
      
      const currentPatient = currentPatientDoc.data() as Patient;
      
      // Handle ward occupancy changes
      const oldWardId = currentPatient.wardId;
      const newWardId = updates.wardId;
      const oldStatus = currentPatient.status;
      const newStatus = updates.status || oldStatus;
      
      // If ward changed or status changed, update ward occupancy
      if (oldWardId !== newWardId || oldStatus !== newStatus) {
        // Decrease occupancy in old ward if patient was admitted
        if (oldWardId && oldStatus === 'admitted') {
          const oldWardRef = doc(db, 'wards', oldWardId);
          const oldWardDoc = await transaction.get(oldWardRef);
          if (oldWardDoc.exists()) {
            const oldWardData = oldWardDoc.data() as Ward;
            transaction.update(oldWardRef, {
              occupiedBeds: Math.max(0, oldWardData.occupiedBeds - 1)
            });
          }
        }
        
        // Increase occupancy in new ward if patient is admitted
        if (newWardId && newStatus === 'admitted') {
          const newWardRef = doc(db, 'wards', newWardId);
          const newWardDoc = await transaction.get(newWardRef);
          if (newWardDoc.exists()) {
            const newWardData = newWardDoc.data() as Ward;
            const newOccupiedBeds = newWardData.occupiedBeds + 1;
            
            // Ensure we don't exceed total beds
            if (newOccupiedBeds > newWardData.totalBeds) {
              throw new Error(`Ward ${newWardData.name} is at full capacity`);
            }
            
            transaction.update(newWardRef, {
              occupiedBeds: newOccupiedBeds
            });
          }
        }
      }
      
      // Auto-set procedure status if procedure is added/removed
      const finalUpdates = { ...updates };
      if (updates.procedure !== undefined) {
        if (updates.procedure && !currentPatient.procedure) {
          // Adding procedure - set to pending
          finalUpdates.procedureStatus = 'pending';
        } else if (!updates.procedure && currentPatient.procedure) {
          // Removing procedure - clear status
          finalUpdates.procedureStatus = undefined;
          finalUpdates.procedureDate = undefined;
        }
      }
      
      // Set procedure date when status changes to completed
      if (updates.procedureStatus === 'completed' && currentPatient.procedureStatus !== 'completed') {
        finalUpdates.procedureDate = new Date();
      }
      
      transaction.update(docRef, {
        ...finalUpdates,
        updatedAt: new Date()
      });
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (id: string) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const docRef = doc(db, 'patients', id);
      
      // Get patient data before deletion to update ward occupancy
      const patientDoc = await transaction.get(docRef);
      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }
      
      const patient = patientDoc.data() as Patient;
      
      if (patient.wardId && patient.status === 'admitted') {
        const wardRef = doc(db, 'wards', patient.wardId);
        const wardDoc = await transaction.get(wardRef);
        if (wardDoc.exists()) {
          const wardData = wardDoc.data() as Ward;
          transaction.update(wardRef, {
            occupiedBeds: Math.max(0, wardData.occupiedBeds - 1)
          });
        }
      }
      
      transaction.delete(docRef);
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

export const addPatientNote = async (patientId: string, note: Omit<PatientNote, 'id'>) => {
  try {
    const noteWithId = {
      ...note,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
    
    const docRef = doc(db, 'patients', patientId);
    await updateDoc(docRef, {
      notes: arrayUnion(noteWithId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding patient note:', error);
    throw new Error('Failed to add patient note');
  }
};

export const scheduleAppointment = async (patientId: string, appointment: Omit<Appointment, 'id'>) => {
  try {
    const appointmentWithId = {
      ...appointment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      scheduledDate: appointment.scheduledDate,
      createdAt: new Date()
    };
    
    const docRef = doc(db, 'patients', patientId);
    await updateDoc(docRef, {
      appointments: arrayUnion(appointmentWithId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    throw new Error('Failed to schedule appointment');
  }
};

// Wards
export const createWard = async (ward: Omit<Ward, 'id' | 'createdAt'>) => {
  try {
    const wardData = {
      ...ward,
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'wards'), wardData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ward:', error);
    throw error;
  }
};

export const getWards = async (): Promise<Ward[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'wards'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    }) as Ward[];
  } catch (error) {
    console.error('Error getting wards:', error);
    throw error;
  }
};

export const updateWard = async (id: string, updates: Partial<Ward>) => {
  try {
    const docRef = doc(db, 'wards', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating ward:', error);
    throw error;
  }
};

export const deleteWard = async (id: string) => {
  try {
    // Check if any patients are assigned to this ward
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const patientsInWard = patientsSnapshot.docs.filter(doc => {
      const patient = doc.data() as Patient;
      return patient.wardId === id && patient.status === 'admitted';
    });
    
    if (patientsInWard.length > 0) {
      throw new Error(`Cannot delete ward. ${patientsInWard.length} patients are currently admitted to this ward.`);
    }
    
    await deleteDoc(doc(db, 'wards', id));
  } catch (error) {
    console.error('Error deleting ward:', error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToPatients = (callback: (patients: Patient[]) => void) => {
  const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const patients = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure dates are properly converted
        admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
        dischargeDate: data.dischargeDate?.toDate ? data.dischargeDate.toDate() : data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        procedureDate: data.procedureDate?.toDate ? data.procedureDate.toDate() : data.procedureDate ? new Date(data.procedureDate) : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        // Ensure notes and appointments arrays exist and convert dates
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          createdAt: note.createdAt?.toDate ? note.createdAt.toDate() : new Date(note.createdAt)
        })),
        appointments: (data.appointments || []).map((apt: any) => ({
          ...apt,
          scheduledDate: apt.scheduledDate?.toDate ? apt.scheduledDate.toDate() : new Date(apt.scheduledDate),
          createdAt: apt.createdAt?.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt)
        }))
      };
    }) as Patient[];
    callback(patients);
  }, (error) => {
    console.error('Error in patients subscription:', error);
  });
};

export const subscribeToWards = (callback: (wards: Ward[]) => void) => {
  const q = query(collection(db, 'wards'), orderBy('name'));
  return onSnapshot(q, (querySnapshot) => {
    const wards = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    }) as Ward[];
    callback(wards);
  }, (error) => {
    console.error('Error in wards subscription:', error);
  });
};

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [patientsSnapshot, wardsSnapshot] = await Promise.all([
      getDocs(collection(db, 'patients')),
      getDocs(collection(db, 'wards'))
    ]);

    const patients = patientsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
        dischargeDate: data.dischargeDate?.toDate ? data.dischargeDate.toDate() : data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        procedureDate: data.procedureDate?.toDate ? data.procedureDate.toDate() : data.procedureDate ? new Date(data.procedureDate) : undefined,
      };
    }) as Patient[];
    
    const wards = wardsSnapshot.docs.map(doc => doc.data() as Ward);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const admittedPatients = patients.filter(p => p.status === 'admitted').length;
    const criticalPatients = patients.filter(p => p.status === 'critical').length;
    const admissionsToday = patients.filter(p => 
      p.admissionDate >= today
    ).length;
    const dischargesToday = patients.filter(p => 
      p.dischargeDate && p.dischargeDate >= today
    ).length;

    // Procedure statistics
    const patientsWithProcedures = patients.filter(p => p.procedure);
    const proceduresPending = patientsWithProcedures.filter(p => p.procedureStatus === 'pending' || !p.procedureStatus).length;
    const proceduresReviewed = patientsWithProcedures.filter(p => p.procedureStatus === 'reviewed').length;
    const proceduresCompleted = patientsWithProcedures.filter(p => p.procedureStatus === 'completed').length;
    const proceduresCompletedThisWeek = patientsWithProcedures.filter(p => 
      p.procedureStatus === 'completed' && p.procedureDate && p.procedureDate >= weekStart
    ).length;

    const totalBeds = wards.reduce((sum, ward) => sum + ward.totalBeds, 0);
    const occupiedBeds = wards.reduce((sum, ward) => sum + ward.occupiedBeds, 0);
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    return {
      totalPatients: patients.length,
      admittedPatients,
      dischargedPatients: patients.filter(p => p.status === 'discharged').length,
      criticalPatients,
      totalWards: wards.length,
      occupancyRate,
      admissionsToday,
      dischargesToday,
      proceduresPending,
      proceduresReviewed,
      proceduresCompleted,
      proceduresCompletedThisWeek
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

// Procedure Analytics
export const getProcedureAnalytics = async (): Promise<ProcedureAnalytics> => {
  try {
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const patients = patientsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
        procedureDate: data.procedureDate?.toDate ? data.procedureDate.toDate() : data.procedureDate ? new Date(data.procedureDate) : undefined,
      };
    }) as Patient[];

    const patientsWithProcedures = patients.filter(p => p.procedure);
    
    // Calculate weekly completion rates for the last 8 weeks
    const weeklyCompletionRate = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekPatients = patientsWithProcedures.filter(p => 
        p.admissionDate >= weekStart && p.admissionDate <= weekEnd
      );
      
      const completed = weekPatients.filter(p => p.procedureStatus === 'completed').length;
      const total = weekPatients.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      
      weeklyCompletionRate.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed,
        total,
        rate
      });
    }

    // Current waiting list (pending + reviewed)
    const currentWaitingList = patientsWithProcedures.filter(p => 
      p.procedureStatus === 'pending' || p.procedureStatus === 'reviewed' || !p.procedureStatus
    ).length;

    // Average wait time (from admission to procedure completion)
    const completedProcedures = patientsWithProcedures.filter(p => 
      p.procedureStatus === 'completed' && p.procedureDate
    );
    
    const totalWaitDays = completedProcedures.reduce((sum, p) => {
      if (p.procedureDate) {
        const waitTime = Math.floor((p.procedureDate.getTime() - p.admissionDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + waitTime;
      }
      return sum;
    }, 0);
    
    const averageWaitTime = completedProcedures.length > 0 ? Math.round(totalWaitDays / completedProcedures.length) : 0;

    // Procedures by status
    const proceduresByStatus = {
      pending: patientsWithProcedures.filter(p => p.procedureStatus === 'pending' || !p.procedureStatus).length,
      reviewed: patientsWithProcedures.filter(p => p.procedureStatus === 'reviewed').length,
      completed: patientsWithProcedures.filter(p => p.procedureStatus === 'completed').length
    };

    return {
      weeklyCompletionRate,
      currentWaitingList,
      averageWaitTime,
      proceduresByStatus
    };
  } catch (error) {
    console.error('Error getting procedure analytics:', error);
    throw error;
  }
};

// Staff/Users
export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    }) as User[];
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
  try {
    const userDoc = {
      ...userData,
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'users'), userDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};