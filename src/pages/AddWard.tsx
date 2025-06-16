import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createWard } from '@/services/database';
import { toast } from 'sonner';

const wardSchema = z.object({
  name: z.string().min(2, 'Ward name must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  totalBeds: z.number().min(1, 'Must have at least 1 bed'),
  occupiedBeds: z.number().min(0, 'Occupied beds cannot be negative'),
  wardType: z.enum(['general', 'icu', 'emergency', 'surgery', 'maternity', 'pediatric']),
});

type WardFormData = z.infer<typeof wardSchema>;

export function AddWard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
    defaultValues: {
      wardType: 'general',
      occupiedBeds: 0,
    },
  });

  const totalBeds = watch('totalBeds');
  const occupiedBeds = watch('occupiedBeds');

  const onSubmit = async (data: WardFormData) => {
    if (data.occupiedBeds > data.totalBeds) {
      toast.error('Occupied beds cannot exceed total beds');
      return;
    }

    setLoading(true);
    
    try {
      await createWard(data);
      toast.success('Ward created successfully!');
      navigate('/wards');
    } catch (error) {
      toast.error('Failed to create ward. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/wards')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Wards
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add New Ward</h1>
        <p className="text-gray-600">Create a new ward for the hospital</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Ward Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Ward Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Ward A, ICU-1"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  {...register('department')}
                  placeholder="e.g., Cardiology, Surgery"
                />
                {errors.department && (
                  <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="wardType">Ward Type *</Label>
                <select
                  id="wardType"
                  {...register('wardType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="icu">ICU</option>
                  <option value="emergency">Emergency</option>
                  <option value="surgery">Surgery</option>
                  <option value="maternity">Maternity</option>
                  <option value="pediatric">Pediatric</option>
                </select>
              </div>

              <div>
                <Label htmlFor="totalBeds">Total Beds *</Label>
                <Input
                  id="totalBeds"
                  type="number"
                  {...register('totalBeds', { valueAsNumber: true })}
                  placeholder="Enter total number of beds"
                />
                {errors.totalBeds && (
                  <p className="text-sm text-red-600 mt-1">{errors.totalBeds.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="occupiedBeds">Currently Occupied Beds</Label>
                <Input
                  id="occupiedBeds"
                  type="number"
                  {...register('occupiedBeds', { valueAsNumber: true })}
                  placeholder="Enter occupied beds"
                />
                {errors.occupiedBeds && (
                  <p className="text-sm text-red-600 mt-1">{errors.occupiedBeds.message}</p>
                )}
                {totalBeds && occupiedBeds > totalBeds && (
                  <p className="text-sm text-red-600 mt-1">
                    Occupied beds cannot exceed total beds
                  </p>
                )}
              </div>
            </div>

            {totalBeds && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Ward Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Beds</p>
                    <p className="font-semibold">{totalBeds}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Occupied</p>
                    <p className="font-semibold">{occupiedBeds || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Available</p>
                    <p className="font-semibold">{totalBeds - (occupiedBeds || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Creating Ward...' : 'Create Ward'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/wards')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}