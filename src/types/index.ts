export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'reception';
  phone?: string;
  department?: string;
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  status: 'admitted' | 'discharged' | 'in-treatment' | 'critical' | 'stable' | 'review' | 'procedure' | 'done';
  wardId?: string;
  bedNumber?: string;
  diagnosis: string;
  procedure?: string;
  religion?: string;
  tribe?: string;
  occupation?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  admissionDate: Date;
  dischargeDate?: Date;
  doctorId?: string;
  notes: PatientNote[];
  appointments: Appointment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  type: 'general' | 'medical' | 'nursing' | 'administrative';
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'consultation' | 'procedure' | 'follow-up' | 'surgery' | 'therapy';
  createdBy: string;
  createdAt: Date;
}

export interface Ward {
  id: string;
  name: string;
  department: string;
  totalBeds: number;
  occupiedBeds: number;
  wardType: 'general' | 'icu' | 'emergency' | 'surgery' | 'maternity' | 'pediatric';
  createdAt: Date;
}

export interface Admission {
  id: string;
  patientId: string;
  wardId: string;
  bedNumber: string;
  admissionDate: Date;
  dischargeDate?: Date;
  status: 'active' | 'discharged';
  doctorId: string;
  notes: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalPatients: number;
  admittedPatients: number;
  dischargedPatients: number;
  criticalPatients: number;
  totalWards: number;
  occupancyRate: number;
  admissionsToday: number;
  dischargesToday: number;
}