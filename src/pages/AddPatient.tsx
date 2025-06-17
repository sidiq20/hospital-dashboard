import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { createPatient, getWards } from '@/services/database';
import { Ward } from '@/types';
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
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function AddPatient() {
  const navigate = useNavigate();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      status: 'admitted',
      gender: 'male',
      procedureStatus: 'pending',
    },
  });

  const selectedWardId = watch('wardId');
  const selectedStatus = watch('status');
  const procedure = watch('procedure');

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

  const getSelectedWard = () => {
    return wards.find(ward => ward.id === selectedWardId);
  };

  const getAvailableBeds = (ward: Ward) => {
    return ward.totalBeds - ward.occupiedBeds;
  };

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate ward capacity if patient is being admitted
      if (data.wardId && data.status === 'admitted') {
        const selectedWard = getSelectedWard();
        if (selectedWard && getAvailableBeds(selectedWard) <= 0) {
          throw new Error(`Ward ${selectedWard.name} is at full capacity. Please select a different ward or change patient status.`);
        }
      }

      const patientData = {
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
        admissionDate: new Date(),
        notes: [],
        appointments: [],
      };

      await createPatient(patientData);
      toast.success('Patient added successfully!');
      navigate('/patients');
    } catch (error: any) {
      console.error('Error adding patient:', error);
      const errorMessage = error.message || 'Failed to add patient. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedWard = getSelectedWard();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add New Patient</h1>
        <p className="text-gray-600">Enter patient information to create a new record</p>
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
                  const isDisabled = selectedStatus === 'admitted' && availableBeds <= 0;
                  
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
              {selectedWard && selectedStatus === 'admitted' && (
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
            {loading ? 'Adding Patient...' : 'Add Patient'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/patients')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}