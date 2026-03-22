"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Phone, Eye, Search, Trash2 } from 'lucide-react';
import { Patient, Appointment } from '@/types';
import { subscribeToPatients, updatePatient } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface AppointmentWithPatient extends Appointment {
  patientName: string;
  patientPhone: string;
  patientId: string;
  patientAge: number;
  patientGender: string;
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPatients((allPatients) => {
      setPatients(allPatients);
      const myAppointments: AppointmentWithPatient[] = [];
      
      if (userProfile) {
        allPatients.forEach(patient => {
          if (patient.appointments && patient.appointments.length > 0) {
            patient.appointments.forEach(appointment => {
              if (appointment.doctorId === userProfile.id) {
                myAppointments.push({
                  ...appointment,
                  patientName: patient.name,
                  patientPhone: patient.phone,
                  patientId: patient.id,
                  patientAge: patient.age,
                  patientGender: patient.gender
                });
              }
            });
          }
        });
      }
      
      myAppointments.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      
      setAppointments(myAppointments);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  useEffect(() => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(appointment => {
        const aptDate = new Date(appointment.scheduledDate);
        switch (dateFilter) {
          case 'upcoming': return aptDate > now;
          case 'today': return aptDate.toDateString() === today.toDateString();
          case 'past': return aptDate < now;
          default: return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, typeFilter, dateFilter]);

  const handleRowClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleUpdateStatus = async (patientId: string, appointmentId: string, newStatus: any) => {
    setUpdatingStatus(appointmentId);
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) throw new Error('Patient not found');
      const updatedAppointments = patient.appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      );
      await updatePatient(patientId, { appointments: updatedAppointments });
      toast.success(`Updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (patientId: string, appointmentId: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) throw new Error('Patient not found');
      const updatedAppointments = patient.appointments.filter(apt => apt.id !== appointmentId);
      await updatePatient(patientId, { appointments: updatedAppointments });
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'completed': return 'bg-green-900 text-green-200 border-green-700';
      case 'cancelled': return 'bg-red-900 text-red-200 border-red-700';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const formatDate = (date: any) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Appointments</h1>
        <p className="text-gray-400">Manage your scheduled patient appointments</p>
      </div>

      <Card className="mb-6 bg-gray-900 border-gray-800">
        <CardContent className="bg-gray-900">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 py-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-gray-700 hover:bg-gray-800">
                  <TableHead className="text-gray-200">Patient</TableHead>
                  <TableHead className="text-gray-200">Appointment</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-200">Status</TableHead>
                  <TableHead className="text-gray-200">Date</TableHead>
                  <TableHead className="text-right text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow 
                    key={apt.id} 
                    className="cursor-pointer hover:bg-gray-800 border-gray-800"
                    onClick={() => handleRowClick(apt.patientId)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-white text-sm">{apt.patientName}</p>
                        <p className="text-xs text-gray-400">{apt.patientPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white text-sm">{apt.title}</p>
                        <p className="text-[10px] text-gray-500">{apt.type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={`capitalize text-[10px] ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-white text-xs">{formatDate(apt.scheduledDate)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleRowClick(apt.patientId)}><Eye className="h-4 w-4" /></Button>
                        {apt.status === 'scheduled' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-400"
                            onClick={() => handleUpdateStatus(apt.patientId, apt.id, 'completed')}
                          >
                            ✓
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 text-white border-gray-800">
                            <AlertDialogHeader><AlertDialogTitle>Delete Appointment?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 border-gray-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600" onClick={() => handleDelete(apt.patientId, apt.id)}>Delete</AlertDialogAction>
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
        </CardContent>
      </Card>
    </div>
  );
}
