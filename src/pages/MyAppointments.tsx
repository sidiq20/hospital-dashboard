import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function MyAppointments() {
  const navigate = useNavigate();
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
      
      // Extract all appointments created by the current user
      const myAppointments: AppointmentWithPatient[] = [];
      
      if (userProfile) {
        allPatients.forEach(patient => {
          if (patient.appointments && patient.appointments.length > 0) {
            patient.appointments.forEach(appointment => {
              // Only include appointments created by the current user
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
      
      // Sort by scheduled date (most recent first)
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm) ||
        appointment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      filtered = filtered.filter(appointment => {
        const aptDate = new Date(appointment.scheduledDate);
        switch (dateFilter) {
          case 'upcoming':
            return aptDate > now;
          case 'today':
            return aptDate >= today && aptDate < tomorrow;
          case 'week':
            return aptDate >= today && aptDate <= nextWeek;
          case 'past':
            return aptDate < now;
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, typeFilter, dateFilter]);

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleUpdateAppointmentStatus = async (patientId: string, appointmentId: string, newStatus: 'completed' | 'cancelled' | 'no-show') => {
    setUpdatingStatus(appointmentId);
    
    try {
      // Find the patient
      const patient = patients.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update the appointment status in the patient's appointments array
      const updatedAppointments = patient.appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      );

      // Update the patient with the new appointments array
      await updatePatient(patientId, { appointments: updatedAppointments });
      
      toast.success(`Appointment marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteAppointment = async (patientId: string, appointmentId: string) => {
    try {
      // Find the patient
      const patient = patients.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Remove the appointment from the patient's appointments array
      const updatedAppointments = patient.appointments.filter(apt => apt.id !== appointmentId);

      // Update the patient with the new appointments array
      await updatePatient(patientId, { appointments: updatedAppointments });
      
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'completed': return 'bg-green-900 text-green-200 border-green-700';
      case 'cancelled': return 'bg-red-900 text-red-200 border-red-700';
      case 'no-show': return 'bg-gray-800 text-gray-300 border-gray-600';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'procedure': return 'bg-purple-900 text-purple-200 border-purple-700';
      case 'follow-up': return 'bg-green-900 text-green-200 border-green-700';
      case 'surgery': return 'bg-red-900 text-red-200 border-red-700';
      case 'therapy': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMyAppointmentStats = () => {
    const now = new Date();
    
    return {
      total: appointments.length,
      upcoming: appointments.filter(apt => 
        new Date(apt.scheduledDate) > now && apt.status === 'scheduled'
      ).length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      noShow: appointments.filter(apt => apt.status === 'no-show').length
    };
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

  const stats = getMyAppointmentStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Appointments</h1>
        <p className="text-gray-400">Appointments you have scheduled with patients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
              </div>
              <div className="h-12 w-12 bg-green-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 bg-purple-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <div className="h-12 w-12 bg-red-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">No Show</p>
                <p className="text-2xl font-bold text-white">{stats.noShow}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-gray-900 border-gray-800">
        <CardHeader className="bg-gray-900">
          <CardTitle className="text-white">Filter My Appointments</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-900">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by patient name, appointment title, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="past">Past</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
              <option value="follow-up">Follow-up</option>
              <option value="surgery">Surgery</option>
              <option value="therapy">Therapy</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0 bg-gray-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-b border-gray-700 hover:bg-gray-800">
                  <TableHead className="min-w-[200px] text-gray-200">Patient</TableHead>
                  <TableHead className="min-w-[200px] text-gray-200">Appointment</TableHead>
                  <TableHead className="hidden md:table-cell text-gray-200">Type</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-200">Status</TableHead>
                  <TableHead className="text-gray-200">Date & Time</TableHead>
                  <TableHead className="text-right min-w-[150px] text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-900">
                {filteredAppointments.map((appointment) => {
                  const isUpcoming = new Date(appointment.scheduledDate) > new Date();
                  const canUpdate = appointment.status === 'scheduled' && isUpcoming;
                  
                  return (
                    <TableRow 
                      key={appointment.id} 
                      className="cursor-pointer hover:bg-gray-800 border-gray-800 transition-colors"
                      onClick={() => handleRowClick(appointment.patientId)}
                    >
                      <TableCell className="py-4">
                        <div>
                          <p className="font-medium text-white">{appointment.patientName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="h-3 w-3" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.patientAge} years • {appointment.patientGender}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="font-medium text-white">{appointment.title}</p>
                          {appointment.description && (
                            <p className="text-sm text-gray-400 truncate max-w-xs">
                              {appointment.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.duration} minutes</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4">
                        <Badge className={`capitalize ${getAppointmentTypeColor(appointment.type)}`}>
                          {appointment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-4">
                        <Badge className={`capitalize ${getAppointmentStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="font-medium text-white">{formatDate(appointment.scheduledDate)}</p>
                          <p className="text-sm text-gray-400">{formatTime(appointment.scheduledDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRowClick(appointment.patientId)}
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canUpdate && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateAppointmentStatus(appointment.patientId, appointment.id, 'completed')}
                                disabled={updatingStatus === appointment.id}
                                className="text-green-400 hover:text-green-300 hover:bg-green-950"
                                title="Mark as Completed"
                              >
                                ✓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateAppointmentStatus(appointment.patientId, appointment.id, 'cancelled')}
                                disabled={updatingStatus === appointment.id}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950"
                                title="Cancel Appointment"
                              >
                                ✕
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateAppointmentStatus(appointment.patientId, appointment.id, 'no-show')}
                                disabled={updatingStatus === appointment.id}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950"
                                title="Mark as No Show"
                              >
                                ?
                              </Button>
                            </>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-red-300 hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Appointment</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Are you sure you want to delete this appointment with {appointment.patientName}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteAppointment(appointment.patientId, appointment.id)}
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
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12 bg-gray-900">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No appointments found.</p>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all' ? (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search criteria or filters.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Appointments you schedule will appear here.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}