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
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  admissionStatus: z.enum(['inpatient', 'outpatient']),
  wardId: z.string().optional(),
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
  onSubmit: (data: PatientFormData & { name: string }) => Promise<void>;
  loading: boolean;
  submitText: string;
}

export function PatientForm({ patient, onSubmit, loading, submitText }: PatientFormProps) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse existing patient name into components
  const parsePatientName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: '', lastName: '' };
    } else if (parts.length === 2) {
      return { firstName: parts[0], middleName: '', lastName: parts[1] };
    } else {
      return { 
        firstName: parts[0], 
        middleName: parts.slice(1, -1).join(' '), 
        lastName: parts[parts.length - 1] 
      };
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? (() => {
      const nameParts = parsePatientName(patient.name);
      return {
        firstName: nameParts.firstName,
        middleName: nameParts.middleName,
        lastName: nameParts.lastName,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address,
        admissionStatus: patient.admissionStatus,
        wardId: patient.wardId || '',
        diagnosis: patient.diagnosis,
        procedure: patient.procedure || '',
        procedureStatus: patient.procedureStatus || 'pending',
        religion: patient.religion || '',
        tribe: patient.tribe || '',
        occupation: patient.occupation || '',
        emergencyContactName: patient.emergencyContact?.name || '',
        emergencyContactPhone: patient.emergencyContact?.phone || '',
        emergencyContactRelationship: patient.emergencyContact?.relationship || '',
      };
    })() : {
      firstName: '',
      middleName: '',
      lastName: '',
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

      // Combine name parts
      const fullName = [data.firstName, data.middleName, data.lastName]
        .filter(part => part && part.trim())
        .join(' ');

      await onSubmit({ ...data, name: fullName });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save patient. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 sm:space-y-8">
        {error && (
          <Alert className="border-red-600 bg-red-950 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-black border-gray-800">
          <CardHeader className="bg-black">
            <CardTitle className="text-white">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-black">
            <div>
              <Label htmlFor="firstName" className="text-white">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter first name"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.firstName && (
                <p className="text-sm text-red-400 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="middleName" className="text-white">Middle Name</Label>
              <Input
                id="middleName"
                {...register('middleName')}
                placeholder="Enter middle name (optional)"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-white">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter last name"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.lastName && (
                <p className="text-sm text-red-400 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="age" className="text-white">Age *</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="Enter age"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.age && (
                <p className="text-sm text-red-400 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender" className="text-white">Gender *</Label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">Phone Number *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.phone && (
                <p className="text-sm text-red-400 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.email && (
                <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="occupation" className="text-white">Occupation</Label>
              <Input
                id="occupation"
                {...register('occupation')}
                placeholder="Enter occupation"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-white">Address *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Enter full address"
                rows={2}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.address && (
                <p className="text-sm text-red-400 mt-1">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="bg-black">
            <CardTitle className="text-white">Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-black">
            <div>
              <Label htmlFor="admissionStatus" className="text-white">Admission Status *</Label>
              <select
                id="admissionStatus"
                {...register('admissionStatus')}
                className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
              >
                <option value="outpatient">Outpatient</option>
                <option value="inpatient">Inpatient</option>
              </select>
            </div>

            {admissionStatus === 'inpatient' && (
              <div>
                <Label htmlFor="wardId" className="text-white">Ward</Label>
                <select
                  id="wardId"
                  {...register('wardId')}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
                >
                  <option value="">Select a ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name} - {ward.department}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="procedure" className="text-white">Procedure</Label>
              <Input
                id="procedure"
                {...register('procedure')}
                placeholder="Enter procedure"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {procedure && (
              <div>
                <Label htmlFor="procedureStatus" className="text-white">Procedure Status</Label>
                <select
                  id="procedureStatus"
                  {...register('procedureStatus')}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="diagnosis" className="text-white">Diagnosis *</Label>
              <Textarea
                id="diagnosis"
                {...register('diagnosis')}
                placeholder="Enter diagnosis"
                rows={3}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              {errors.diagnosis && (
                <p className="text-sm text-red-400 mt-1">{errors.diagnosis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="bg-black">
            <CardTitle className="text-white">Emergency Contact (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-black">
            <div>
              <Label htmlFor="emergencyContactName" className="text-white">Contact Name</Label>
              <Input
                id="emergencyContactName"
                {...register('emergencyContactName')}
                placeholder="Enter emergency contact name"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="emergencyContactPhone" className="text-white">Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                {...register('emergencyContactPhone')}
                placeholder="Enter emergency contact phone"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="emergencyContactRelationship" className="text-white">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                {...register('emergencyContactRelationship')}
                placeholder="e.g., Spouse, Parent, Sibling"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="bg-black">
            <CardTitle className="text-white">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-black">
            <div>
              <Label htmlFor="religion" className="text-white">Religion</Label>
              <Input
                id="religion"
                {...register('religion')}
                placeholder="Enter religion"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="tribe" className="text-white">Tribe/Ethnicity</Label>
              <Input
                id="tribe"
                {...register('tribe')}
                placeholder="Enter tribe or ethnicity"
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-white">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Enter any additional notes or observations"
                rows={3}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : submitText}
          </Button>
        </div>
      </form>
    </div>
  );
}