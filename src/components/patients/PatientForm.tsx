import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getWards } from '@/services/database';
import { Ward, Patient } from '@/types';
import { toast } from 'sonner';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  admissionStatus: z.enum(['inpatient', 'outpatient']),
  wardId: z.string().optional(),
  bedNumber: z.string().optional(),
  diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
  procedure: z.string().optional(),
  procedureStatus: z.enum(['pending', 'reviewed', 'completed']).optional(),
  religion: z.string().optional(),
  tribe: z.string().optional(),
  occupation: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormData) => Promise<void>;
  loading: boolean;
  submitText: string;
}

export function PatientForm({ patient, onSubmit, loading, submitText }: PatientFormProps) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address,
      admissionStatus: patient.admissionStatus,
      wardId: patient.wardId || '',
      bedNumber: patient.bedNumber || '',
      diagnosis: patient.diagnosis,
      procedure: patient.procedure || '',
      procedureStatus: patient.procedureStatus || 'pending',
      religion: patient.religion || '',
      tribe: patient.tribe || '',
      occupation: patient.occupation || '',
      emergencyContactName: patient.emergencyContact?.name || '',
      emergencyContactPhone: patient.emergencyContact?.phone || '',
      emergencyContactRelationship: patient.emergencyContact?.relationship || '',
    } : {
      gender: 'male',
      admissionStatus: 'outpatient',
      procedureStatus: 'pending',
    },
  });

  const admissionStatus = watch('admissionStatus');
  const procedure = watch('procedure');
  const hasEmergencyContact = watch('emergencyContactName') || watch('emergencyContactPhone');

  useEffect(() => {
    const loadWards = async () => {
      try {
        const wardData = await getWards();
        setWards(wardData);
      } catch (error) {
        console.error('Error loading wards:', error);
        toast.error('Failed to load wards');
      }
    };
    loadWards();
  }, []);

  const handleFormSubmit = async (data: PatientFormData) => {
    setError(null);
    
    try {
      // Validate emergency contact completeness
      if (hasEmergencyContact && (!data.emergencyContactName || !data.emergencyContactPhone || !data.emergencyContactRelationship)) {
        throw new Error('Please fill in all emergency contact fields or leave them all empty.');
      }

      await onSubmit(data);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save patient. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 sm:space-y-8">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

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
            <Label htmlFor="admissionStatus">Admission Status *</Label>
            <select
              id="admissionStatus"
              {...register('admissionStatus')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="outpatient">Outpatient</option>
              <option value="inpatient">Inpatient</option>
            </select>
          </div>

          {admissionStatus === 'inpatient' && (
            <>
              <div>
                <Label htmlFor="wardId">Ward</Label>
                <select
                  id="wardId"
                  {...register('wardId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name} - {ward.department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bedNumber">Bed Number</Label>
                <Input
                  id="bedNumber"
                  {...register('bedNumber')}
                  placeholder="Enter bed number"
                />
              </div>
            </>
          )}

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
          <CardTitle>Emergency Contact (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              {...register('emergencyContactName')}
              placeholder="Enter emergency contact name"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              {...register('emergencyContactPhone')}
              placeholder="Enter emergency contact phone"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContactRelationship">Relationship</Label>
            <Input
              id="emergencyContactRelationship"
              {...register('emergencyContactRelationship')}
              placeholder="e.g., Spouse, Parent, Sibling"
            />
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

          <div className="md:col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter any additional notes or observations"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
}