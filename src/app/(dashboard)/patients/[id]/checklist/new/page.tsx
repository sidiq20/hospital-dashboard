"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProcedureChecklistForm } from '@/components/patients/ProcedureChecklistForm';
import { getPatient, saveProcedureChecklist } from '@/services/database';
import { Patient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewChecklistPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { userProfile } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const data = await getPatient(id);
        if (data) {
          setPatient(data);
        } else {
          toast.error('Patient not found');
          router.push('/patients');
        }
      } catch (error) {
        console.error('Error loading patient:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPatient();
    }
  }, [id, router]);

  const handleSubmit = async (formData: any) => {
    if (!patient || !userProfile) return;

    setSaving(true);
    try {
      const checklistData: Omit<ProcedureChecklist, 'id' | 'createdAt'> = {
        patientId: patient.id,
        patientName: formData.patientName,
        age: formData.age,
        gender: formData.gender,
        procedure: formData.procedure,
        indication: formData.indication,
        diagnosis: formData.diagnosis,
        date: new Date(formData.date),
        radiologicalDiagnosis: formData.radiologicalDiagnosis,
        pathologicalDiagnosis: formData.pathologicalDiagnosis,
        procedureNote: formData.procedureNote,
        preProcedureVitals: formData.preProcedureVitals,
        sections: {
          preProcedure: formData.preProcedureItems,
          procedure: formData.procedureItems,
          postProcedure: formData.postProcedureItems,
        },
        createdBy: userProfile.id,
        createdByName: userProfile.name,
      };

      await saveProcedureChecklist(checklistData);
      toast.success('Procedure checklist saved successfully!');
      router.push(`/patients/${patient.id}`);
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-400">Loading patient details...</p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/patients/${patient.id}`)}
          className="text-slate-400 hover:text-white hover:bg-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient Profile
        </Button>
      </div>

      <ProcedureChecklistForm 
        patient={patient} 
        onSubmit={handleSubmit} 
        loading={saving} 
      />
    </div>
  );
}
