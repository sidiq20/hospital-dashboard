"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/patients/PatientForm';
import { createPatient } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AddPatientPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      const patientData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        admissionStatus: data.admissionStatus,
        status: 'active' as const,
        wardId: data.admissionStatus === 'inpatient' ? data.wardId : undefined,
        bedNumber: data.admissionStatus === 'inpatient' ? data.bedNumber : undefined,
        diagnosis: data.diagnosis,
        procedure: data.procedure || undefined,
        procedureStatus: data.procedure ? (data.procedureStatus || 'pending') : undefined,
        religion: data.religion || undefined,
        tribe: data.tribe || undefined,
        occupation: data.occupation || undefined,
        emergencyContact: (data.emergencyContactName && data.emergencyContactPhone && data.emergencyContactRelationship) ? {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelationship,
        } : undefined,
        admissionDate: new Date(),
        notes: [],
        appointments: [],
        biopsyResults: [],
        reviews: [],
      };

      const patientId = await createPatient(patientData, userProfile?.id, userProfile?.name);
      toast.success('Patient added successfully!');
      router.push(`/patients/${patientId}/checklist/new`);
    } catch (error: any) {
      console.error('Error adding patient:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/patients')}
          className="mb-4 text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Add New Patient</h1>
        <p className="text-slate-400">Enter patient information to create a new record</p>
      </div>

      <PatientForm
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Add Patient"
      />
    </div>
  );
}
