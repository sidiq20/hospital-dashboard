import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Eye, Search } from 'lucide-react';
import { Patient, Appointment } from '@/types';
import { subscribeToPatients } from '@/services/database';
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

interface AppointmentWithPatient extends Appointment {
  patientName: string;
  patientPhone: string;
  patientId: string;
  patientAge: number;
  patientGender: string;
}

export function UpcomingAppointments() {
  const navigate = useNavigate();
  const [, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPatients((allPatients) => {
      setPatients(allPatients);
      
      // Extract all upcoming appointments from all patients
      const allAppointments: AppointmentWithPatient[] = [];
      const now = new Date();
      
      allPatients.forEach(patient => {
        if (patient.appointments && patient.appointments.length > 0) {
          patient.appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.scheduledDate);
            // Only include future appointments with 'scheduled' status
            if (appointmentDate > now && appointment.status === 'scheduled') {
              allAppointments.push({
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
      
      // Sort by scheduled date (earliest first)
      allAppointments.sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
      
      setAppointments(allAppointments);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm) ||
        appointment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.doctorName === doctorFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      filtered = filtered.filter(appointment => {
        const aptDate = new Date(appointment.scheduledDate);
        switch (dateFilter) {
          case 'today':
            return aptDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return aptDate.toDateString() === tomorrow.toDateString();
          case 'week':
            return aptDate <= nextWeek;
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, typeFilter, doctorFilter, dateFilter]);

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
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

  const getUpcomingStats = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return {
      today: appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate.toDateString() === today.toDateString();
      }).length,
      tomorrow: appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate.toDateString() === tomorrow.toDateString();
      }).length,
      thisWeek: appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return aptDate <= nextWeek;
      }).length,
      total: appointments.length
    };
  };

  const getUniqueDoctors = () => {
    const doctors = [...new Set(appointments.map(apt => apt.doctorName))];
    return doctors.sort();
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

  const stats = getUpcomingStats();
  const uniqueDoctors = getUniqueDoctors();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Upcoming Appointments</h1>
        <p className="text-gray-400">All scheduled appointments across the hospital</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Today</p>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
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
                <p className="text-sm font-medium text-gray-400">Tomorrow</p>
                <p className="text-2xl font-bold text-white">{stats.tomorrow}</p>
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
                <p className="text-sm font-medium text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
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
                <p className="text-sm font-medium text-gray-400">Total Upcoming</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
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
          <CardTitle className="text-white">Filter Appointments</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-900">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by patient, appointment, doctor, or phone..."
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
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
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
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            >
              <option value="all">All Doctors</option>
              {uniqueDoctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  Dr. {doctor}
                </option>
              ))}
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
                  <TableHead className="hidden lg:table-cell text-gray-200">Doctor</TableHead>
                  <TableHead className="text-gray-200">Date & Time</TableHead>
                  <TableHead className="text-right min-w-[100px] text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-900">
                {filteredAppointments.map((appointment) => (
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
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Dr. {appointment.doctorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <p className="font-medium text-white">{formatDate(appointment.scheduledDate)}</p>
                        <p className="text-sm text-gray-400">{formatTime(appointment.scheduledDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(appointment.patientId)}
                          className="text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12 bg-gray-900">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming appointments found.</p>
              {searchTerm || typeFilter !== 'all' || doctorFilter !== 'all' || dateFilter !== 'all' ? (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search criteria or filters.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Appointments will appear here when they are scheduled.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}