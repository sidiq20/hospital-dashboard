import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPatient, updatePatient, getWards } from '@/services/database';
import { Patient, Ward } from '@/types';
import { toast } from 'sonner';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  status: z.enum(['admitted', 'discharged', 'in-treatment', 'critical', 'stable', 'review', 'procedure', 'done']),
  wardId: z.string().optional(),
  bedNumber: z.string().optional(),
  diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
  procedure: z.string().optional(),
  procedureStatus: z.enum(['pending', 'reviewed', 'completed']).optional(),
  religion: z.string().optional(),
  tribe: z.string().optional(),
  occupation: z.string().optional(),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function EditPatient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const selectedWardId = watch('wardId');
  const selectedStatus = watch('status');
  const procedure = watch('procedure');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const [patientData, wardData] = await Promise.all([
          getPatient(id),
          getWards()
        ]);
        
        if (patientData) {
          setPatient(patientData);
          setWards(wardData);
          
          // Reset form with patient data
          reset({
            name: patientData.name,
            age: patientData.age,
            gender: patientData.gender,
            phone: patientData.phone,
            email: patientData.email || '',
            address: patientData.address,
            status: patientData.status,
            wardId: patientData.wardId || '',
            bedNumber: patientData.bedNumber || '',
            diagnosis: patientData.diagnosis,
            procedure: patientData.procedure || '',
            procedureStatus: patientData.procedureStatus || 'pending',
            religion: patientData.religion || '',
            tribe: patientData.tribe || '',
            occupation: patientData.occupation || '',
            emergencyContactName: patientData.emergencyContact.name,
            emergencyContactPhone: patientData.emergencyContact.phone,
            emergencyContactRelationship: patientData.emergencyContact.relationship,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, reset]);

  const getSelectedWard = () => {
    return wards.find(ward => ward.id === selectedWardId);
  };

  const getAvailableBeds = (ward: Ward) => {
    // If this is the current ward, add 1 to available beds since patient will be moved out
    const adjustment = patient?.wardId === ward.id ? 1 : 0;
    return ward.totalBeds - ward.occupiedBeds + adjustment;
  };

  const onSubmit = async (data: PatientFormData) => {
    if (!id || !patient) return;
    
    setError(null);
    
    // Validate ward capacity if patient is being admitted to a new ward
    if (data.wardId && data.status === 'admitted' && data.wardId !== patient.wardId) {
      const selectedWard = getSelectedWard();
      if (selectedWard && getAvailableBeds(selectedWard) <= 0) {
        setError(`Ward ${selectedWard.name} is at full capacity. Please select a different ward or change patient status.`);
        return;
      }
    }
    
    setSaving(true);
    
    try {
      const updates: Partial<Patient> = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        status: data.status,
        wardId: data.wardId || undefined,
        bedNumber: data.bedNumber || undefined,
        diagnosis: data.diagnosis,
        procedure: data.procedure || undefined,
        procedureStatus: data.procedure ? (data.procedureStatus || 'pending') : undefined,
        religion: data.religion || undefined,
        tribe: data.tribe || undefined,
        occupation: data.occupation || undefined,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelationship,
        },
      };

      // Handle discharge date
      if (data.status === 'discharged' && patient.status !== 'discharged') {
        updates.dischargeDate = new Date();
      } else if (data.status !== 'discharged' && patient.status === 'discharged') {
        updates.dischargeDate = undefined;
      }

      await updatePatient(id, updates);
      toast.success('Patient updated successfully!');
      navigate(`/patients/${id}`);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      const errorMessage = error.message || 'Failed to update patient. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const selectedWard = getSelectedWard();

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

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="Enter age"
              />
              {errors.age && (
                <p className="text-sm text-red-600 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                {...register('occupation')}
                placeholder="Enter occupation"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Enter full address"
                rows={2}
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
                <option value="in-treatment">In Treatment</option>
                <option value="critical">Critical</option>
                <option value="stable">Stable</option>
                <option value="review">Review</option>
                <option value="procedure">Procedure</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <Label htmlFor="wardId">Ward</Label>
              <select
                id="wardId"
                {...register('wardId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a ward</option>
                {wards.map((ward) => {
                  const availableBeds = getAvailableBeds(ward);
                  const isDisabled = selectedStatus === 'admitted' && selectedWardId !== patient.wardId && availableBeds <= 0;
                  
                  return (
                    <option 
                      key={ward.id} 
                      value={ward.id}
                      disabled={isDisabled}
                    >
                      {ward.name} - {ward.department} ({availableBeds}/{ward.totalBeds} available)
                      {isDisabled ? ' - FULL' : ''}
                    </option>
                  );
                })}
              </select>
              {selectedWard && selectedStatus === 'admitted' && selectedWardId !== patient.wardId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedWard.name}</strong> - {selectedWard.department}
                  </p>
                  <p className="text-sm text-blue-600">
                    Available beds: {getAvailableBeds(selectedWard)} of {selectedWard.totalBeds}
                  </p>
                  {getAvailableBeds(selectedWard) <= 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ This ward is at full capacity
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="bedNumber">Bed Number</Label>
              <Input
                id="bedNumber"
                {...register('bedNumber')}
                placeholder="Enter bed number"
              />
            </div>

            <div>
              <Label htmlFor="procedure">Procedure</Label>
              <Input
                id="procedure"
                {...register('procedure')}
                placeholder="Enter procedure"
              />
            </div>

            {procedure && (
              <div>
                <Label htmlFor="procedureStatus">Procedure Status</Label>
                <select
                  id="procedureStatus"
                  {...register('procedureStatus')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Textarea
                id="diagnosis"
                {...register('diagnosis')}
                placeholder="Enter diagnosis"
                rows={3}
              />
              {errors.diagnosis && (
                <p className="text-sm text-red-600 mt-1">{errors.diagnosis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="emergencyContactName">Contact Name *</Label>
              <Input
                id="emergencyContactName"
                {...register('emergencyContactName')}
                placeholder="Enter emergency contact name"
              />
              {errors.emergencyContactName && (
                <p className="text-sm text-red-600 mt-1">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
              <Input
                id="emergencyContactPhone"
                {...register('emergencyContactPhone')}
                placeholder="Enter emergency contact phone"
              />
              {errors.emergencyContactPhone && (
                <p className="text-sm text-red-600 mt-1">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
              <Input
                id="emergencyContactRelationship"
                {...register('emergencyContactRelationship')}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
              {errors.emergencyContactRelationship && (
                <p className="text-sm text-red-600 mt-1">{errors.emergencyContactRelationship.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                {...register('religion')}
                placeholder="Enter religion"
              />
            </div>

            <div>
              <Label htmlFor="tribe">Tribe/Ethnicity</Label>
              <Input
                id="tribe"
                {...register('tribe')}
                placeholder="Enter tribe or ethnicity"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/patients/${id}`)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}