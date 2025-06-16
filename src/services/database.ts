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
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Patient, Ward, User, DashboardStats, PatientNote, Appointment } from '@/types';

// Patients
export const createPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
  const patientData = {
    ...patient,
    notes: [],
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Use transaction to ensure consistency
  return await runTransaction(db, async (transaction) => {
    // Create patient document
    const patientRef = doc(collection(db, 'patients'));
    transaction.set(patientRef, patientData);
    
    // If patient is assigned to a ward and admitted, update ward occupancy
    if (patient.wardId && patient.status === 'admitted') {
      const wardRef = doc(db, 'wards', patient.wardId);
      const wardDoc = await transaction.get(wardRef);
      
      if (wardDoc.exists()) {
        const wardData = wardDoc.data() as Ward;
        const newOccupiedBeds = wardData.occupiedBeds + 1;
        
        // Ensure we don't exceed total beds
        if (newOccupiedBeds <= wardData.totalBeds) {
          transaction.update(wardRef, {
            occupiedBeds: newOccupiedBeds
          });
        }
      }
    }
    
    return patientRef.id;
  });
};

export const getPatient = async (id: string): Promise<Patient | null> => {
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
};

export const getPatients = async (): Promise<Patient[]> => {
  const querySnapshot = await getDocs(collection(db, 'patients'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      // Ensure dates are properly converted
      admissionDate: data.admissionDate?.toDate ? data.admissionDate.toDate() : new Date(data.admissionDate),
      dischargeDate: data.dischargeDate?.toDate ? data.dischargeDate.toDate() : data.dischargeDate ? new Date(data.dischargeDate) : undefined,
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
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  return await runTransaction(db, async (transaction) => {
    const docRef = doc(db, 'patients', id);
    
    // Get current patient data to check for ward changes
    const currentPatientDoc = await transaction.get(docRef);
    if (!currentPatientDoc.exists()) return;
    
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
          if (newOccupiedBeds <= newWardData.totalBeds) {
            transaction.update(newWardRef, {
              occupiedBeds: newOccupiedBeds
            });
          }
        }
      }
    }
    
    transaction.update(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  });
};

export const deletePatient = async (id: string) => {
  return await runTransaction(db, async (transaction) => {
    const docRef = doc(db, 'patients', id);
    
    // Get patient data before deletion to update ward occupancy
    const patientDoc = await transaction.get(docRef);
    if (!patientDoc.exists()) return;
    
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
  const wardData = {
    ...ward,
    createdAt: new Date()
  };
  const docRef = await addDoc(collection(db, 'wards'), wardData);
  return docRef.id;
};

export const getWards = async (): Promise<Ward[]> => {
  const querySnapshot = await getDocs(collection(db, 'wards'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    };
  }) as Ward[];
};

export const updateWard = async (id: string, updates: Partial<Ward>) => {
  const docRef = doc(db, 'wards', id);
  await updateDoc(docRef, updates);
};

export const deleteWard = async (id: string) => {
  await deleteDoc(doc(db, 'wards', id));
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
  });
};

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
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
    };
  }) as Patient[];
  
  const wards = wardsSnapshot.docs.map(doc => doc.data() as Ward);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const admittedPatients = patients.filter(p => p.status === 'admitted').length;
  const criticalPatients = patients.filter(p => p.status === 'critical').length;
  const admissionsToday = patients.filter(p => 
    p.admissionDate >= today
  ).length;
  const dischargesToday = patients.filter(p => 
    p.dischargeDate && p.dischargeDate >= today
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
    dischargesToday
  };
};

// Staff/Users
export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    };
  }) as User[];
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
  const userDoc = {
    ...userData,
    createdAt: new Date()
  };
  const docRef = await addDoc(collection(db, 'users'), userDoc);
  return docRef.id;
};