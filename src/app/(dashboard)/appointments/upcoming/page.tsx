"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function UpcomingAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPatients((allPatients) => {
      const allAppointments: AppointmentWithPatient[] = [];
      const now = new Date();
      
      allPatients.forEach(patient => {
        if (patient.appointments && patient.appointments.length > 0) {
          patient.appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.scheduledDate);
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

    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }

    if (doctorFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.doctorName === doctorFilter);
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      filtered = filtered.filter(appointment => {
        const aptDate = new Date(appointment.scheduledDate);
        switch (dateFilter) {
          case 'today': return aptDate.toDateString() === today.toDateString();
          case 'tomorrow': return aptDate.toDateString() === tomorrow.toDateString();
          case 'week': return aptDate <= nextWeek;
          default: return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, typeFilter, doctorFilter, dateFilter]);

  const handleRowClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
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

  const formatDate = (date: any) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (date: any) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
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

  const uniqueDoctors = [...new Set(appointments.map(apt => apt.doctorName))].sort();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Upcoming Appointments</h1>
        <p className="text-gray-400">All scheduled appointments across the hospital</p>
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
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
              <option value="follow-up">Follow-up</option>
            </select>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Doctors</option>
              {uniqueDoctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
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
                  <TableHead className="hidden md:table-cell text-gray-200">Type</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-200">Doctor</TableHead>
                  <TableHead className="text-gray-200">Date & Time</TableHead>
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
                        <p className="text-xs text-gray-400">{apt.duration} mins</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`capitalize text-[10px] ${getAppointmentTypeColor(apt.type)}`}>
                        {apt.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-white text-sm">
                      Dr. {apt.doctorName}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white text-xs">{formatDate(apt.scheduledDate)}</p>
                        <p className="text-[10px] text-gray-400">{formatTime(apt.scheduledDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"><Eye className="h-4 w-4" /></Button>
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
