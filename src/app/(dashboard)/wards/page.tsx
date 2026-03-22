"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, Edit, Trash2 } from 'lucide-react';
import { Ward } from '@/types';
import { subscribeToWards, deleteWard } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function WardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToWards((wards) => {
      setWards(wards);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteWard(id);
      toast.success('Ward deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="p-8"><div className="animate-pulse h-8 bg-gray-800 rounded w-1/4 mb-6"></div></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Wards</h1>
          <p className="text-gray-400">Hospital occupancy and departments</p>
        </div>
        <Link href="/wards/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Ward
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wards.map((ward) => (
          <Card key={ward.id} className="bg-gray-900 border-gray-800 hover:shadow-xl transition-all">
            <CardHeader className="pb-3 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ward.name}</CardTitle>
                <Badge className="bg-gray-800 text-gray-300 border-gray-700">{(ward.wardType || 'general').toUpperCase()}</Badge>
              </div>
              <p className="text-sm text-gray-400">{ward.department}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-4">
                <Link href={`/wards/${ward.id}/edit`}>
                  <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-950"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                    <AlertDialogHeader><AlertDialogTitle>Delete Ward?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 text-white" onClick={() => handleDelete(ward.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
