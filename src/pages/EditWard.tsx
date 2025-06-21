import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWards, updateWard } from '@/services/database';
import { Ward } from '@/types';
import { toast } from 'sonner';

const wardSchema = z.object({
  name: z.string().min(2, 'Ward name must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  wardType: z.enum(['general', 'icu', 'emergency', 'surgery', 'maternity', 'pediatric']),
});

type WardFormData = z.infer<typeof wardSchema>;

export function EditWard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ward, setWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
  });

  useEffect(() => {
    const loadWard = async () => {
      if (!id) return;
      
      try {
        const wards = await getWards();
        const wardData = wards.find(w => w.id === id);
        
        if (wardData) {
          setWard(wardData);
          reset({
            name: wardData.name,
            department: wardData.department,
            wardType: wardData.wardType,
          });
        }
      } catch (error) {
        console.error('Error loading ward:', error);
        toast.error('Failed to load ward data');
      } finally {
        setLoading(false);
      }
    };

    loadWard();
  }, [id, reset]);

  const onSubmit = async (data: WardFormData) => {
    if (!id) return;
    
    setSaving(true);
    
    try {
      await updateWard(id, data);
      toast.success('Ward updated successfully!');
      navigate('/wards');
    } catch (error) {
      toast.error('Failed to update ward. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Ward not found</p>
          <Button onClick={() => navigate('/wards')} className="mt-4">
            Back to Wards
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
          onClick={() => navigate('/wards')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Wards
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Edit Ward: {ward.name}
        </h1>
        <p className="text-gray-600">Update ward information</p>
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

              <div className="md:col-span-2">
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
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
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