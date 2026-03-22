"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Patient, ProcedureChecklist } from '@/types';
import { getPatient, getProcedureChecklist, updateProcedureChecklist } from '@/services/database';
import { ProcedureChecklistForm } from '@/components/patients/ProcedureChecklistForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EditChecklistPage() {
  const params = useParams();
  const patientId = params.id as string;
  const checklistId = params.checklistId as string;
  const router = useRouter();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [checklist, setChecklist] = useState<ProcedureChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientData, checklistData] = await Promise.all([
          getPatient(patientId),
          getProcedureChecklist(checklistId)
        ]);
        
        if (!patientData || !checklistData) {
          toast.error('Data not found');
          router.push(`/patients/${patientId}`);
          return;
        }
        
        setPatient(patientData);
        setChecklist(checklistData);
      } catch (error) {
        console.error('Error loading checklist:', error);
        toast.error('Failed to load checklist');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, checklistId, router]);

  const handleSubmit = async (formData: any) => {
    if (!checklist) return;
    
    setSaving(true);
    try {
      const updates: any = {
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
      };

      await updateProcedureChecklist(checklistId, updates);
      toast.success('Checklist updated successfully');
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient || !checklist) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/patients/${patientId}`)}
          className="text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient
        </Button>
      </div>

      <ProcedureChecklistForm 
        patient={patient} 
        initialData={checklist}
        onSubmit={handleSubmit} 
        loading={saving} 
      />
    </div>
  );
}
