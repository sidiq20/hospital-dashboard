"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/patients/PatientForm';
import { getPatient, updatePatient } from '@/services/database';
import { Patient } from '@/types';
import { toast } from 'sonner';

export default function EditPatientPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;
      
      try {
        const patientData = await getPatient(id);
        setPatient(patientData);
      } catch (error) {
        console.error('Error loading patient:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!id || !patient) return;
    
    setSaving(true);
    
    try {
      const updates: Partial<Patient> = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        wardId: data.wardId || undefined,
        bedNumber: data.bedNumber || undefined,
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
      };

      await updatePatient(id, updates);
      toast.success('Patient updated successfully!');
      router.push(`/patients/${id}`);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-400">Patient not found</p>
          <Button onClick={() => router.push('/patients')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/patients/${id}`)}
          className="mb-4 text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient Details
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Edit Patient: {patient.name}
        </h1>
        <p className="text-gray-400">Update patient information and medical records</p>
      </div>

      <PatientForm
        patient={patient}
        onSubmit={handleSubmit}
        loading={saving}
        submitText="Save Changes"
      />
    </div>
  );
}
