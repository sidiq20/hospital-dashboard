"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  wardType: z.enum(['general', 'icu', 'emergency', 'surgery', 'maternity', 'pediatric']),
});

type WardFormData = z.infer<typeof wardSchema>;

export default function AddWardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
    defaultValues: { wardType: 'general' },
  });

  const onSubmit = async (data: WardFormData) => {
    setLoading(true);
    try {
      await createWard(data);
      toast.success('Ward created successfully!');
      router.push('/wards');
    } catch (error) {
      toast.error('Failed to create ward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" onClick={() => router.push('/wards')} className="mb-4 text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Add New Ward</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white">Ward Information</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-gray-300">Ward Name</Label>
                <Input id="name" {...register('name')} className="bg-gray-800 border-gray-700 text-white" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="department" className="text-gray-300">Department</Label>
                <Input id="department" {...register('department')} className="bg-gray-800 border-gray-700 text-white" />
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
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
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" /> {loading ? 'Creating...' : 'Create Ward'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
