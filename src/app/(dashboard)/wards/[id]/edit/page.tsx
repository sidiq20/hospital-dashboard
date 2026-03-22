"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditWardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [ward, setWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
  });

  useEffect(() => {
    const loadWard = async () => {
      try {
        const wards = await getWards();
        const wardData = wards.find(w => w.id === id);
        if (wardData) {
          setWard(wardData);
          reset({
            name: wardData.name,
            department: wardData.department,
            wardType: wardData.wardType as any,
          });
        }
      } catch (error) {
        toast.error('Failed to load ward');
      } finally {
        setLoading(false);
      }
    };
    loadWard();
  }, [id, reset]);

  const onSubmit = async (data: WardFormData) => {
    setSaving(true);
    try {
      await updateWard(id, data);
      toast.success('Ward updated');
      router.push('/wards');
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><div className="animate-pulse h-8 bg-gray-800 rounded w-1/4 mb-6"></div></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" onClick={() => router.push('/wards')} className="mb-4 text-white hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Ward: {ward?.name}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white">Ward Information</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-gray-300">Ward Name</Label>
                <Input id="name" {...register('name')} className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <Label htmlFor="department" className="text-gray-300">Department</Label>
                <Input id="department" {...register('department')} className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="wardType" className="text-gray-300">Ward Type</Label>
                <select id="wardType" {...register('wardType')} className="w-full bg-gray-800 border-gray-700 text-white rounded-md p-2">
                  <option value="general">General</option>
                  <option value="icu">ICU</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
