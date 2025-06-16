import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Patient, Ward } from '@/types';
import { subscribeToPatients, deletePatient, getWards } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWards = async () => {
      try {
        const wardsData = await getWards();
        setWards(wardsData);
      } catch (error) {
        console.error('Error loading wards:', error);
      }
    };

    loadWards();

    const unsubscribe = subscribeToPatients((patients) => {
      setPatients(patients);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter]);

  const handleDeletePatient = async (id: string) => {
    try {
      await deletePatient(id);
      toast.success('Patient deleted successfully');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'default';
      case 'discharged': return 'secondary';
      case 'critical': return 'destructive';
      case 'stable': return 'secondary';
      case 'in-treatment': return 'default';
      case 'review': return 'outline';
      case 'procedure': return 'default';
      case 'done': return 'secondary';
      default: return 'outline';
    }
  };

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? `${ward.name} - ${ward.department}` : 'Not assigned';
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Patients</h1>
          <p className="text-gray-600">Manage patient records and information</p>
        </div>
        <Link to="/patients/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, diagnosis, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="admitted">Admitted</option>
              <option value="discharged">Discharged</option>
              <option value="critical">Critical</option>
              <option value="stable">Stable</option>
              <option value="in-treatment">In Treatment</option>
              <option value="review">Review</option>
              <option value="procedure">Procedure</option>
              <option value="done">Done</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Age</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Ward</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[200px]">Diagnosis</TableHead>
                  <TableHead className="hidden xl:table-cell">Admission Date</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600 sm:hidden">Age: {patient.age}</p>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{patient.age}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(patient.status)} className="text-xs">
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {patient.wardId ? `${getWardName(patient.wardId)}${patient.bedNumber ? ` - ${patient.bedNumber}` : ''}` : 'Not assigned'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="max-w-xs truncate" title={patient.diagnosis}>
                        {patient.diagnosis}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(patient.admissionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/patients/${patient.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit Patient">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Delete Patient">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the patient record for {patient.name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePatient(patient.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No patients found matching your criteria.</p>
              <Link to="/patients/new" className="inline-block mt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Patient
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}