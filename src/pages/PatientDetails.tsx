import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  Heart,
  Stethoscope,
  Bed,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  CheckCircle,
  Activity
} from 'lucide-react';
import { Patient, PatientNote, Appointment, Ward } from '@/types';
import { getPatient, addPatientNote, scheduleAppointment, getWards, updatePatient } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'medical' | 'nursing' | 'administrative'>('general');
  const [addingNote, setAddingNote] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    duration: 30,
    type: 'consultation' as 'consultation' | 'procedure' | 'follow-up' | 'surgery' | 'therapy'
  });
  const [schedulingAppointment, setSchedulingAppointment] = useState(false);
  const [updatingProcedure, setUpdatingProcedure] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const [patientData, wardsData] = await Promise.all([
          getPatient(id),
          getWards()
        ]);
        setPatient(patientData);
        setWards(wardsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddNote = async () => {
    if (!noteContent.trim() || !patient || !userProfile) return;

    setAddingNote(true);
    try {
      const note: Omit<PatientNote, 'id'> = {
        content: noteContent.trim(),
        createdBy: userProfile.id,
        createdByName: userProfile.name,
        createdAt: new Date(),
        type: noteType
      };

      await addPatientNote(patient.id, note);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      setNoteContent('');
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!appointmentData.title.trim() || !appointmentData.scheduledDate || !patient || !userProfile) return;

    setSchedulingAppointment(true);
    try {
      const appointment: Omit<Appointment, 'id'> = {
        patientId: patient.id,
        doctorId: userProfile.id,
        doctorName: userProfile.name,
        title: appointmentData.title.trim(),
        description: appointmentData.description.trim() || undefined,
        scheduledDate: new Date(appointmentData.scheduledDate),
        duration: appointmentData.duration,
        status: 'scheduled',
        type: appointmentData.type,
        createdBy: userProfile.id,
        createdAt: new Date()
      };

      await scheduleAppointment(patient.id, appointment);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      setAppointmentData({
        title: '',
        description: '',
        scheduledDate: '',
        duration: 30,
        type: 'consultation'
      });
      toast.success('Appointment scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule appointment');
    } finally {
      setSchedulingAppointment(false);
    }
  };

  const handleUpdateProcedureStatus = async (newStatus: 'pending' | 'reviewed' | 'completed') => {
    if (!patient) return;

    setUpdatingProcedure(true);
    try {
      await updatePatient(patient.id, { procedureStatus: newStatus });
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      toast.success(`Procedure status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update procedure status');
    } finally {
      setUpdatingProcedure(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return AlertCircle;
      case 'stable': return Heart;
      case 'in-treatment': return Stethoscope;
      case 'procedure': return Stethoscope;
      default: return User;
    }
  };

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'destructive';
      case 'nursing': return 'default';
      case 'administrative': return 'secondary';
      default: return 'outline';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'outline';
    }
  };

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? `${ward.name} - ${ward.department}` : wardId;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Patient not found</p>
          <Button onClick={() => navigate('/patients')} className="mt-4">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(patient.status);
  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusColor(patient.status)} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {patient.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Patient ID: {patient.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Patient Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="noteType">Note Type</Label>
                    <select
                      id="noteType"
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="medical">Medical</option>
                      <option value="nursing">Nursing</option>
                      <option value="administrative">Administrative</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="noteContent">Note Content</Label>
                    <Textarea
                      id="noteContent"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleAddNote} 
                    disabled={addingNote || !noteContent.trim()}
                    className="w-full"
                  >
                    {addingNote ? 'Adding Note...' : 'Add Note'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Appointment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appointmentTitle">Title</Label>
                    <Input
                      id="appointmentTitle"
                      value={appointmentData.title}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Follow-up consultation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointmentType">Type</Label>
                    <select
                      id="appointmentType"
                      value={appointmentData.type}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="procedure">Procedure</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="surgery">Surgery</option>
                      <option value="therapy">Therapy</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="scheduledDate">Date & Time</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={appointmentData.scheduledDate}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={appointmentData.duration}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={appointmentData.description}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about the appointment..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleScheduleAppointment} 
                    disabled={schedulingAppointment || !appointmentData.title.trim() || !appointmentData.scheduledDate}
                    className="w-full"
                  >
                    {schedulingAppointment ? 'Scheduling...' : 'Schedule Appointment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Link to={`/patients/${patient.id}/edit`}>
              <Button className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Patient
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p className="text-lg font-semibold">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-lg font-semibold capitalize">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-semibold">{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-lg font-semibold">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-gray-900">{patient.address}</p>
                </div>
              </div>

              {(patient.occupation || patient.religion || patient.tribe) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {patient.occupation && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Occupation</p>
                        <p className="text-gray-900">{patient.occupation}</p>
                      </div>
                    )}
                    {patient.religion && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Religion</p>
                        <p className="text-gray-900">{patient.religion}</p>
                      </div>
                    )}
                    {patient.tribe && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tribe</p>
                        <p className="text-gray-900">{patient.tribe}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Diagnosis</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{patient.diagnosis}</p>
              </div>
              
              {patient.procedure && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500">Procedure</p>
                    {userProfile && (userProfile.role === 'doctor' || userProfile.role === 'admin') && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('pending')}
                          disabled={updatingProcedure || patient.procedureStatus === 'pending'}
                          className="text-xs"
                        >
                          Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('reviewed')}
                          disabled={updatingProcedure || patient.procedureStatus === 'reviewed'}
                          className="text-xs"
                        >
                          Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('completed')}
                          disabled={updatingProcedure || patient.procedureStatus === 'completed'}
                          className="text-xs"
                        >
                          Completed
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900 mb-2">{patient.procedure}</p>
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getProcedureStatusColor(patient.procedureStatus)}`}>
                        <ProcedureIcon className="h-3 w-3" />
                        {patient.procedureStatus || 'pending'}
                      </div>
                      {patient.procedureDate && patient.procedureStatus === 'completed' && (
                        <p className="text-xs text-gray-500">
                          Completed: {formatDate(patient.procedureDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patient.wardId && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ward</p>
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{getWardName(patient.wardId)}</p>
                    </div>
                  </div>
                )}
                {patient.bedNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bed Number</p>
                    <p className="text-gray-900">{patient.bedNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900 font-semibold">{patient.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900 font-semibold">{patient.emergencyContact.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Relationship</p>
                  <p className="text-gray-900 font-semibold">{patient.emergencyContact.relationship}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admitted</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(patient.admissionDate)}
                  </p>
                </div>
              </div>
              
              {patient.dischargeDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Discharged</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(patient.dischargeDate)}
                    </p>
                  </div>
                </div>
              )}

              {patient.procedureDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Procedure Completed</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(patient.procedureDate)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          {patient.appointments && patient.appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.appointments
                    .filter(apt => apt.status === 'scheduled' && new Date(apt.scheduledDate) > new Date())
                    .slice(0, 3)
                    .map((appointment) => (
                    <div key={appointment.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{appointment.title}</p>
                        <Badge variant={getAppointmentStatusColor(appointment.status)} className="text-xs">
                          {appointment.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">Dr. {appointment.doctorName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {patient.notes && patient.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getNoteTypeColor(note.type)} className="text-xs">
                          {note.type}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{note.content}</p>
                      <p className="text-xs text-gray-500">by {note.createdByName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}