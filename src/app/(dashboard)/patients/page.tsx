"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Clock, FileText, CheckCircle, Activity, Filter } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PatientsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [procedureFilter, setProcedureFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
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

  const getWeeklyData = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + (i * 7)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      weeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekStart,
        weekEnd
      });
    }
    
    return weeks;
  };

  useEffect(() => {
    let filtered = patients;

    if (weekFilter !== 'all') {
      const weeklyData = getWeeklyData();
      const selectedWeek = weeklyData[parseInt(weekFilter)];
      
      if (selectedWeek) {
        filtered = filtered.filter(patient => {
          const admissionDate = new Date(patient.admissionDate);
          return admissionDate >= selectedWeek.weekStart && admissionDate <= selectedWeek.weekEnd;
        });
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        (patient.procedure && patient.procedure.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.doctorName && patient.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
  }, [patients, searchTerm, statusFilter, procedureFilter, weekFilter]);

  const handleDeletePatient = async (id: string) => {
    try {
      await deletePatient(id);
      toast.success('Patient deleted successfully');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const handleRowClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reviewed': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getRowBackgroundColor = (patient: Patient) => {
    if (!patient.procedure) return 'hover:bg-slate-900/50';
    switch (patient.procedureStatus) {
      case 'pending': return 'bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06] border-l-4 border-l-yellow-600/50';
      case 'reviewed': return 'bg-primary/[0.03] hover:bg-primary/[0.06] border-l-4 border-l-primary/50';
      case 'completed': return 'bg-green-500/[0.03] hover:bg-green-500/[0.06] border-l-4 border-l-green-600/50';
      default: return 'hover:bg-slate-900/50';
    }
  };

  const getCellBackgroundColor = (patient: Patient) => {
    return ''; // Transparent by default
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

  const formatDate = (date: any) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const weeklyData = getWeeklyData();

  if (loading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-900 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-slate-900 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-tight">Patients</h1>
          <p className="text-slate-400">Manage patient records and procedure pipeline</p>
        </div>
        <Link href="/patients/new">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
      </div>

      <Card className="mb-6 bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Filter Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input
                placeholder="Search name, diagnosis, procedure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                className="px-3 py-2 border border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px] bg-slate-950 text-white text-sm"
              >
                <option value="all">All Weeks</option>
                {weeklyData.map((week, index) => (
                  <option key={index} value={index.toString()}>
                    Week of {week.week}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="min-w-[200px] text-slate-300 uppercase text-[10px] font-bold tracking-wider">Patient Info</TableHead>
                  <TableHead className="hidden sm:table-cell text-slate-300 uppercase text-[10px] font-bold tracking-wider">Age</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px] text-slate-300 uppercase text-[10px] font-bold tracking-wider">Diagnosis</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[200px] text-slate-300 uppercase text-[10px] font-bold tracking-wider">Procedure</TableHead>
                  <TableHead className="hidden xl:table-cell text-slate-300 uppercase text-[10px] font-bold tracking-wider">Doctor</TableHead>
                  <TableHead className="hidden xl:table-cell text-slate-300 uppercase text-[10px] font-bold tracking-wider">Admission</TableHead>
                  <TableHead className="text-right min-w-[120px] text-slate-300 uppercase text-[10px] font-bold tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);
                  const canDelete = userProfile?.role === 'consultant' || userProfile?.role === 'doctor';
                  
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
                      <TableCell className={`hidden xl:table-cell ${getCellBackgroundColor(patient)} py-2`}>
                        {patient.doctorName ? (
                          <div className="text-xs">
                            <p className="font-medium text-white">Dr. {patient.doctorName}</p>
                            {patient.consultantName && (
                              <p className="text-xs text-green-300">Consultant: {patient.consultantName}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className={`hidden xl:table-cell ${getCellBackgroundColor(patient)} text-white py-2`}>
                        <span className="text-xs">{formatDate(patient.admissionDate)}</span>
                      </TableCell>
                      <TableCell className={`text-right ${getCellBackgroundColor(patient)} py-2`}>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/patients/${patient.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Patient" className="text-gray-300 hover:text-white hover:bg-gray-700 h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Delete Patient" className="text-gray-300 hover:text-red-300 hover:bg-red-950 h-8 w-8 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    This action cannot be undone. This will permanently delete the patient record for {patient.name}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePatient(patient.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-20 bg-slate-950/20">
              <p className="text-slate-500 mb-6">No patients found matching your criteria.</p>
              <Link href="/patients/new">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8">
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
