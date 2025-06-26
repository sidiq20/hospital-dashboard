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
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { removeUndefined } from '@/lib/utils';
import { Patient, Ward, User, DashboardStats, PatientNote, Appointment, BiopsyResult, PatientReview, ProcedureAnalytics } from '@/types';

// Helper function to safely convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// Helper function to safely convert patient data
const convertPatientData = (data: any): Patient => {
  return {
    ...data,
    admissionDate: convertTimestamp(data.admissionDate),
    dischargeDate: data.dischargeDate ? convertTimestamp(data.dischargeDate) : undefined,
    procedureDate: data.procedureDate ? convertTimestamp(data.procedureDate) : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    notes: (data.notes || []).map((note: any) => ({
      ...note,
      createdAt: convertTimestamp(note.createdAt)
    })),
    appointments: (data.appointments || []).map((apt: any) => ({
      ...apt,
      scheduledDate: convertTimestamp(apt.scheduledDate),
      createdAt: convertTimestamp(apt.createdAt)
    })),
    biopsyResults: (data.biopsyResults || []).map((result: any) => ({
      ...result,
      performedDate: convertTimestamp(result.performedDate),
      createdAt: convertTimestamp(result.createdAt)
    })),
    reviews: (data.reviews || []).map((review: any) => ({
      ...review,
      createdAt: convertTimestamp(review.createdAt),
      images: (review.images || []).map((img: any) => ({
        ...img,
        uploadedAt: convertTimestamp(img.uploadedAt)
      }))
    }))
  };
};

// Patients
export const createPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>, doctorId?: string, doctorName?: string) => {
  try {
    const patientData = removeUndefined({
      ...patient,
      notes: patient.notes || [],
      appointments: patient.appointments || [],
      biopsyResults: patient.biopsyResults || [],
      reviews: patient.reviews || [],
      procedureStatus: patient.procedure ? (patient.procedureStatus || 'pending') : undefined,
      doctorId: doctorId,
      doctorName: doctorName,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create patient directly without ward occupancy tracking
    const docRef = await addDoc(collection(db, 'patients'), patientData);
    return docRef.id;
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
      return convertPatientData({ id: docSnap.id, ...data }) as Patient;
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
      return convertPatientData({ id: doc.id, ...data });
    }) as Patient[];
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  try {
    const docRef = doc(db, 'patients', id);
    
    // Get current patient data
    const currentPatientDoc = await getDoc(docRef);
    if (!currentPatientDoc.exists()) {
      throw new Error('Patient not found');
    }
    
    const currentPatient = currentPatientDoc.data() as Patient;
    
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
    
    // Handle discharge date
    if (updates.status === 'discharged' && currentPatient.status !== 'discharged') {
      finalUpdates.dischargeDate = new Date();
    } else if (updates.status !== 'discharged' && currentPatient.status === 'discharged') {
      finalUpdates.dischargeDate = undefined;
    }
    
    const cleanedUpdates = removeUndefined({
      ...finalUpdates,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (id: string) => {
  try {
    const docRef = doc(db, 'patients', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

export const addPatientNote = async (patientId: string, note: Omit<PatientNote, 'id'>) => {
  try {
    const noteWithId = removeUndefined({
      ...note,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    });
    
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
    const appointmentWithId = removeUndefined({
      ...appointment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      scheduledDate: appointment.scheduledDate,
      createdAt: new Date()
    });
    
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

export const addBiopsyResult = async (patientId: string, biopsyResult: Omit<BiopsyResult, 'id'>) => {
  try {
    const resultWithId = removeUndefined({
      ...biopsyResult,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      performedDate: biopsyResult.performedDate,
      createdAt: new Date()
    });
    
    const docRef = doc(db, 'patients', patientId);
    await updateDoc(docRef, {
      biopsyResults: arrayUnion(resultWithId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding biopsy result:', error);
    throw new Error('Failed to add biopsy result');
  }
};

export const addPatientReview = async (patientId: string, review: Omit<PatientReview, 'id'>) => {
  try {
    const reviewWithId = removeUndefined({
      ...review,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    });
    
    const docRef = doc(db, 'patients', patientId);
    await updateDoc(docRef, {
      reviews: arrayUnion(reviewWithId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding patient review:', error);
    throw new Error('Failed to add patient review');
  }
};

// Wards
export const createWard = async (ward: Omit<Ward, 'id' | 'createdAt'>) => {
  try {
    const wardData = removeUndefined({
      ...ward,
      createdAt: new Date()
    });
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
        createdAt: convertTimestamp(data.createdAt)
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
    const cleanedUpdates = removeUndefined(updates);
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating ward:', error);
    throw error;
  }
};

export const deleteWard = async (id: string) => {
  try {
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
      return convertPatientData({ id: doc.id, ...data });
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
        createdAt: convertTimestamp(data.createdAt)
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
      return convertPatientData(data);
    }) as Patient[];
    
    const wards = wardsSnapshot.docs.map(doc => doc.data() as Ward);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const admittedPatients = patients.filter(p => p.status === 'active').length;
    const admissionsToday = patients.filter(p => 
      p.admissionDate >= today
    ).length;

    // Procedure statistics
    const patientsWithProcedures = patients.filter(p => p.procedure);
    const proceduresPending = patientsWithProcedures.filter(p => p.procedureStatus === 'pending' || !p.procedureStatus).length;
    const proceduresReviewed = patientsWithProcedures.filter(p => p.procedureStatus === 'reviewed').length;
    const proceduresCompleted = patientsWithProcedures.filter(p => p.procedureStatus === 'completed').length;
    const proceduresCompletedThisWeek = patientsWithProcedures.filter(p => 
      p.procedureStatus === 'completed' && p.procedureDate && p.procedureDate >= weekStart
    ).length;

    return {
      totalPatients: patients.length,
      admittedPatients,
      dischargedPatients: patients.filter(p => p.status === 'discharged').length,
      criticalPatients: 0, // Removed as requested
      totalWards: wards.length,
      occupancyRate: 0, // Removed as requested
      admissionsToday,
      dischargesToday: 0, // Simplified
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
      return convertPatientData(data);
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
        createdAt: convertTimestamp(data.createdAt)
      };
    }) as User[];
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
  try {
    const userDoc = removeUndefined({
      ...userData,
      createdAt: new Date()
    });
    const docRef = await addDoc(collection(db, 'users'), userDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};