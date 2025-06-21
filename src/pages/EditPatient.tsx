import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/patients/PatientForm';
import { getPatient, updatePatient } from '@/services/database';
import { Patient } from '@/types';
import { toast } from 'sonner';

export function EditPatient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      navigate(`/patients/${id}`);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Patient not found</p>
          <Button onClick={() => navigate('/patients')} className="mt-4">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/patients/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient Details
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Edit Patient: {patient.name}
        </h1>
        <p className="text-gray-600">Update patient information and medical records</p>
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