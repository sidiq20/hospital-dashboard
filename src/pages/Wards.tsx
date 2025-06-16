import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Bed, Users, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Ward } from '@/types';
import { subscribeToWards, deleteWard } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export function Wards() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToWards((wards) => {
      setWards(wards);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleDeleteWard = async (id: string) => {
    try {
      await deleteWard(id);
      toast.success('Ward deleted successfully');
    } catch (error) {
      toast.error('Failed to delete ward');
    }
  };

  const getWardTypeColor = (type: string) => {
    switch (type) {
      case 'icu': return 'destructive';
      case 'emergency': return 'destructive';
      case 'surgery': return 'default';
      case 'maternity': return 'secondary';
      case 'pediatric': return 'outline';
      case 'general': return 'secondary';
      default: return 'outline';
    }
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Wards</h1>
          <p className="text-gray-600">Manage hospital wards and bed occupancy</p>
        </div>
        <Link to="/wards/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Ward
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Wards</p>
                <p className="text-2xl font-bold text-gray-900">{wards.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wards.reduce((sum, ward) => sum + ward.totalBeds, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bed className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied Beds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wards.reduce((sum, ward) => sum + ward.occupiedBeds, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wards.length > 0 
                    ? Math.round((wards.reduce((sum, ward) => sum + ward.occupiedBeds, 0) / 
                        wards.reduce((sum, ward) => sum + ward.totalBeds, 0)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wards.map((ward) => {
          const occupancyPercentage = ward.totalBeds > 0 
            ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) 
            : 0;
          
          return (
            <Card key={ward.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ward.name}</CardTitle>
                  <Badge variant={getWardTypeColor(ward.wardType || 'general')} className="text-xs">
                    {(ward.wardType || 'general').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{ward.department}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bed Occupancy</span>
                  <span className={`font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
                    {ward.occupiedBeds}/{ward.totalBeds} ({occupancyPercentage}%)
                  </span>
                </div>
                
                <Progress 
                  value={occupancyPercentage} 
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{ward.totalBeds}</p>
                    <p className="text-gray-600">Total Beds</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">
                      {ward.totalBeds - ward.occupiedBeds}
                    </p>
                    <p className="text-gray-600">Available</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/wards/${ward.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Ward</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {ward.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteWard(ward.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {wards.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No wards found</p>
          <Link to="/wards/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Ward
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}