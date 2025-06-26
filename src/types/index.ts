export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'consultant';
  phone?: string;
  department?: string;
  specialization?: string;
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
  admissionStatus: 'inpatient' | 'outpatient';
  status: 'active' | 'discharged' | 'done';
  wardId?: string; // Only for inpatients
  bedNumber?: string; // Added bed number field
  diagnosis: string;
  procedure?: string;
  procedureStatus?: 'pending' | 'reviewed' | 'completed';
  procedureDate?: Date;
  consultantId?: string; // Added when procedure is marked as done
  consultantName?: string;
  doctorId?: string; // Doctor who created the patient
  doctorName?: string; // Name of doctor who created the patient
  religion?: string;
  tribe?: string;
  occupation?: string;
  emergencyContact?: { // Made optional
    name: string;
    phone: string;
    relationship: string;
  };
  admissionDate: Date;
  dischargeDate?: Date;
  notes: PatientNote[];
  appointments: Appointment[];
  biopsyResults: BiopsyResult[];
  reviews: PatientReview[]; // Added reviews array
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

export interface BiopsyResult {
  id: string;
  title: string;
  description?: string;
  result: string;
  performedBy: string;
  performedByName: string;
  performedDate: Date;
  createdAt: Date;
}

export interface PatientReview {
  id: string;
  type: 'ct_images' | 'mri_images' | 'ultrasound_images' | 'blood_tests' | 'inr';
  title: string;
  description?: string;
  images: ReviewImage[];
  textContent?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export interface ReviewImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

export interface Ward {
  id: string;
  name: string;
  department: string;
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
  proceduresPending: number;
  proceduresReviewed: number;
  proceduresCompleted: number;
  proceduresCompletedThisWeek: number;
}

export interface ProcedureAnalytics {
  weeklyCompletionRate: {
    week: string;
    completed: number;
    total: number;
    rate: number;
  }[];
  currentWaitingList: number;
  averageWaitTime: number;
  proceduresByStatus: {
    pending: number;
    reviewed: number;
    completed: number;
  };
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  department?: string;
  experience: number; // years
  qualifications: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface ExportData {
  patients: Patient[];
  wards: Ward[];
  stats: DashboardStats;
  procedureAnalytics: ProcedureAnalytics;
  exportDate: Date;
  dateRange: {
    start: Date;
    end: Date;
    type: 'day' | 'week' | 'month' | 'year' | 'custom';
  };
}