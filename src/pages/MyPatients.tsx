import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Clock, FileText, CheckCircle, Activity, UserPlus } from 'lucide-react';
import { Patient, Ward } from '@/types';
import { subscribeToPatients, deletePatient, getWards } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function MyPatients() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [procedureFilter, setProcedureFilter] = useState('all');
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

    const unsubscribe = subscribeToPatients((allPatients) => {
      // Filter patients created by current doctor
      if (userProfile) {
        const myPatients = allPatients.filter(patient => patient.doctorId === userProfile.id);
        setPatients(myPatients);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        (patient.procedure && patient.procedure.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.consultantName && patient.consultantName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    if (procedureFilter !== 'all') {
      if (procedureFilter === 'has-procedure') {
        filtered = filtered.filter(patient => patient.procedure);
      } else if (procedureFilter === 'no-procedure') {
        filtered = filtered.filter(patient => !patient.procedure);
      } else {
        filtered = filtered.filter(patient => patient.procedureStatus === procedureFilter);
      }
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter, procedureFilter]);

  const handleDeletePatient = async (id: string) => {
    try {
      await deletePatient(id);
      toast.success('Patient deleted successfully');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'active': return 'default';
  //     case 'discharged': return 'secondary';
  //     case 'done': return 'secondary';
  //     default: return 'outline';
  //   }
  // };

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'reviewed': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'completed': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getRowBackgroundColor = (patient: Patient) => {
    // If patient has no procedure, use default styling
    if (!patient.procedure) {
      return 'hover:bg-gray-800 bg-gray-900';
    }

    // Color-code based on procedure status
    switch (patient.procedureStatus) {
      case 'pending':
        return 'bg-yellow-950 hover:bg-yellow-900 border-l-4 border-l-yellow-600';
      case 'reviewed':
        return 'bg-blue-950 hover:bg-blue-900 border-l-4 border-l-blue-600';
      case 'completed':
        return 'bg-green-950 hover:bg-green-900 border-l-4 border-l-green-600';
      default:
        return 'bg-yellow-950 hover:bg-yellow-900 border-l-4 border-l-yellow-600'; // Default to pending style
    }
  };

  const getCellBackgroundColor = (patient: Patient) => {
    // If patient has no procedure, use default styling
    if (!patient.procedure) {
      return 'bg-gray-900';
    }

    // Color-code based on procedure status
    switch (patient.procedureStatus) {
      case 'pending':
        return 'bg-yellow-950';
      case 'reviewed':
        return 'bg-blue-950';
      case 'completed':
        return 'bg-green-950';
      default:
        return 'bg-yellow-950'; // Default to pending style
    }
  };

  const getProcedureStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'reviewed': return FileText;
      case 'completed': return CheckCircle;
      default: return Activity;
    }
  };

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? `${ward.name} - ${ward.department}` : 'Not assigned';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8 bg-gray-950 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Patients</h1>
          <p className="text-gray-400">Patients you have created and are managing</p>
        </div>
        <Link to="/patients/new">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Stats Card */}
      <Card className="mb-6 bg-gray-900 border-gray-800">
        <CardContent className="p-6 bg-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{patients.length}</p>
              <p className="text-sm text-gray-400">Total Patients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {patients.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {patients.filter(p => p.status === 'done').length}
              </p>
              <p className="text-sm text-gray-400">Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {patients.filter(p => p.procedure && p.procedureStatus === 'pending').length}
              </p>
              <p className="text-sm text-gray-400">Pending Procedures</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6 bg-gray-900 border-gray-800">
        <CardHeader className="bg-gray-900">
          <CardTitle className="text-white">Filter Patients</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, diagnosis, procedure, phone, or consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] bg-gray-800 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
              <option value="done">Done</option>
            </select>
            <select
              value={procedureFilter}
              onChange={(e) => setProcedureFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] bg-gray-800 text-white"
            >
              <option value="all">All Procedures</option>
              <option value="has-procedure">Has Procedure</option>
              <option value="no-procedure">No Procedure</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0 bg-gray-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-b border-gray-700 hover:bg-gray-800">
                  <TableHead className="min-w-[200px] text-gray-200">Patient Info</TableHead>
                  <TableHead className="hidden sm:table-cell text-gray-200">Age</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px] text-gray-200">Diagnosis</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[200px] text-gray-200">Procedure</TableHead>
                  <TableHead className="hidden xl:table-cell text-gray-200">Admission Date</TableHead>
                  <TableHead className="text-right min-w-[120px] text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-900">
                {filteredPatients.map((patient) => {
                  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);
                  
                  return (
                    <TableRow 
                      key={patient.id} 
                      className={`cursor-pointer transition-all duration-200 border-gray-800 ${getRowBackgroundColor(patient)}`}
                      onClick={() => handleRowClick(patient.id)}
                    >
                      <TableCell className={`font-medium ${getCellBackgroundColor(patient)} py-2`}>
                        <div>
                          <p className="font-medium text-white text-sm">{patient.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">Age: {patient.age}</p>
                          <p className="text-xs text-gray-400">{patient.phone}</p>
                          {patient.consultantName && (
                            <p className="text-xs text-green-300 mt-1">
                              Consultant: {patient.consultantName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`hidden sm:table-cell ${getCellBackgroundColor(patient)} text-white py-2`}>{patient.age}</TableCell>
                      <TableCell className={`hidden md:table-cell ${getCellBackgroundColor(patient)} py-2`}>
                        <div className="max-w-xs">
                          <p className="truncate font-medium text-white text-sm" title={patient.diagnosis}>
                            {patient.diagnosis}
                          </p>
                          {patient.wardId && (
                            <p className="text-xs text-gray-400 truncate">
                              {getWardName(patient.wardId)}
                              {patient.bedNumber && ` - Bed ${patient.bedNumber}`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`hidden lg:table-cell ${getCellBackgroundColor(patient)} py-2`}>
                        {patient.procedure ? (
                          <div className="max-w-xs">
                            <p className="truncate font-medium text-xs text-white" title={patient.procedure}>
                              {patient.procedure}
                            </p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getProcedureStatusColor(patient.procedureStatus)}`}>
                              <ProcedureIcon className="h-3 w-3" />
                              {patient.procedureStatus || 'pending'}
                            </div>
                            {patient.procedureDate && patient.procedureStatus === 'completed' && (
                              <p className="text-xs text-gray-400 mt-1">
                                Completed: {formatDate(patient.procedureDate)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No procedure</span>
                        )}
                      </TableCell>
                      <TableCell className={`hidden xl:table-cell ${getCellBackgroundColor(patient)} text-white py-2`}>
                        <span className="text-xs">{formatDate(patient.admissionDate)}</span>
                      </TableCell>
                      <TableCell className={`text-right ${getCellBackgroundColor(patient)} py-2`}>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/patients/${patient.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Patient" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Patient" className="text-gray-300 hover:text-red-300 hover:bg-red-950 h-8 w-8 p-0">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  This action cannot be undone. This will permanently delete the patient record for {patient.name}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePatient(patient.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-12 bg-gray-900">
              <UserPlus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No patients found matching your criteria.</p>
              <Link to="/patients/new" className="inline-block mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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