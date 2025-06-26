import { useEffect, useState } from 'react';
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  Stethoscope,
  Bed,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle,
  Activity,
  UserCheck,
  UserPlus,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { Patient, PatientNote, Appointment, BiopsyResult, PatientReview, Ward, User as UserType } from '@/types';
import { getPatient, addPatientNote, scheduleAppointment, addBiopsyResult, addPatientReview, getWards, updatePatient, getUsers } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PatientNoteDialog } from '@/components/patients/PatientNoteDialog';
import { AppointmentDialog } from '@/components/patients/AppointmentDialog';
import { BiopsyResultDialog } from '@/components/patients/BiopsyResultDialog';
import { PatientReviewDialog } from '@/components/patients/PatientReviewDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [consultants, setConsultants] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [schedulingAppointment, setSchedulingAppointment] = useState(false);
  const [addingBiopsyResult, setAddingBiopsyResult] = useState(false);
  const [addingReview, setAddingReview] = useState(false);
  const [updatingProcedure, setUpdatingProcedure] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [markDoneDialogOpen, setMarkDoneDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [selectedReview, setSelectedReview] = useState<PatientReview | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const [patientData, wardsData, usersData] = await Promise.all([
          getPatient(id),
          getWards(),
          getUsers()
        ]);
        setPatient(patientData);
        setWards(wardsData);
        setConsultants(usersData.filter(user => user.role === 'consultant'));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddNote = async (noteData: Omit<PatientNote, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => {
    if (!patient || !userProfile) return;

    setAddingNote(true);
    try {
      const note: Omit<PatientNote, 'id'> = {
        ...noteData,
        createdBy: userProfile.id,
        createdByName: userProfile.name,
        createdAt: new Date()
      };

      await addPatientNote(patient.id, note);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
      throw error;
    } finally {
      setAddingNote(false);
    }
  };

  const handleScheduleAppointment = async (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'doctorId' | 'doctorName' | 'createdBy' | 'createdAt'>) => {
    if (!patient || !userProfile) return;

    setSchedulingAppointment(true);
    try {
      const appointment: Omit<Appointment, 'id'> = {
        ...appointmentData,
        patientId: patient.id,
        doctorId: userProfile.id,
        doctorName: userProfile.name,
        createdBy: userProfile.id,
        createdAt: new Date()
      };

      await scheduleAppointment(patient.id, appointment);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      toast.success('Appointment scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule appointment');
      throw error;
    } finally {
      setSchedulingAppointment(false);
    }
  };

  const handleAddBiopsyResult = async (resultData: Omit<BiopsyResult, 'id' | 'performedBy' | 'performedByName' | 'performedDate' | 'createdAt'>) => {
    if (!patient || !userProfile) return;

    setAddingBiopsyResult(true);
    try {
      const biopsyResult: Omit<BiopsyResult, 'id'> = {
        ...resultData,
        performedBy: userProfile.id,
        performedByName: userProfile.name,
        performedDate: new Date(),
        createdAt: new Date()
      };

      await addBiopsyResult(patient.id, biopsyResult);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      toast.success('Biopsy result added successfully');
    } catch (error) {
      toast.error('Failed to add biopsy result');
      throw error;
    } finally {
      setAddingBiopsyResult(false);
    }
  };

  const handleAddReview = async (reviewData: Omit<PatientReview, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => {
    if (!patient || !userProfile) return;

    setAddingReview(true);
    try {
      const review: Omit<PatientReview, 'id'> = {
        ...reviewData,
        createdBy: userProfile.id,
        createdByName: userProfile.name,
        createdAt: new Date()
      };

      await addPatientReview(patient.id, review);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      toast.success('Review added successfully');
    } catch (error) {
      toast.error('Failed to add review');
      throw error;
    } finally {
      setAddingReview(false);
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

  const handleMarkAsDone = async () => {
    if (!patient || !userProfile) return;

    setMarkingDone(true);
    try {
      let updates: any = { 
        status: 'done'
      };

      if (userProfile.role === 'doctor') {
        // Doctor marking as done - must select a consultant
        if (!selectedConsultant) {
          throw new Error('Please select a consultant');
        }
        const consultant = consultants.find(c => c.id === selectedConsultant);
        if (!consultant) {
          throw new Error('Selected consultant not found');
        }
        updates.consultantId = consultant.id;
        updates.consultantName = consultant.name;
      } else if (userProfile.role === 'consultant') {
        // Consultant marking as done - assign themselves
        updates.consultantId = userProfile.id;
        updates.consultantName = userProfile.name;
      }

      await updatePatient(patient.id, updates);
      
      // Refresh patient data
      const updatedPatient = await getPatient(patient.id);
      setPatient(updatedPatient);
      
      setMarkDoneDialogOpen(false);
      setSelectedConsultant('');
      
      if (userProfile.role === 'doctor') {
        toast.success(`Patient marked as done and assigned to ${updates.consultantName}`);
      } else {
        toast.success('Patient marked as done');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark patient as done');
    } finally {
      setMarkingDone(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'discharged': return 'secondary';
      case 'done': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return CheckCircle;
      default: return User;
    }
  };

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'reviewed': return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'completed': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
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

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'ct_images':
      case 'mri_images':
      case 'ultrasound_images':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const getReviewTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ct_images': 'CT Images',
      'mri_images': 'MRI Images',
      'ultrasound_images': 'Ultrasound Images',
      'blood_tests': 'Blood Tests',
      'inr': 'INR'
    };
    return labels[type] || type;
  };

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? ward.name : wardId;
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
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-800 rounded"></div>
              <div className="h-48 bg-gray-800 rounded"></div>
            </div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-400">Patient not found</p>
          <Button onClick={() => navigate('/patients')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(patient.status);
  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-4 text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-white">Back to Patients</span>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusColor(patient.status)} className="flex items-center gap-1 bg-gray-800 text-white border-gray-600">
                <StatusIcon className="h-3 w-3" />
                <span className="text-white">{patient.status}</span>
              </Badge>
              <span className="text-sm text-gray-400">
                Patient ID: {patient.id.slice(-8).toUpperCase()}
              </span>
              {patient.consultantName && (
                <Badge variant="outline" className="flex items-center gap-1 bg-green-900 text-green-200 border-green-700">
                  <UserCheck className="h-3 w-3" />
                  <span className="text-green-200">Consultant: {patient.consultantName}</span>
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <PatientNoteDialog
              onAddNote={handleAddNote}
              loading={addingNote}
            />

            <AppointmentDialog
              onScheduleAppointment={handleScheduleAppointment}
              loading={schedulingAppointment}
            />

            <BiopsyResultDialog
              onAddBiopsyResult={handleAddBiopsyResult}
              loading={addingBiopsyResult}
            />

            <PatientReviewDialog
              onAddReview={handleAddReview}
              loading={addingReview}
            />

            {patient.status !== 'done' && (
              <Dialog open={markDoneDialogOpen} onOpenChange={setMarkDoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-white">Mark as Done</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Mark Patient as Done</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {userProfile?.role === 'doctor' && (
                      <div>
                        <Label htmlFor="consultant" className="text-white">Assign to Consultant</Label>
                        <select
                          id="consultant"
                          value={selectedConsultant}
                          onChange={(e) => setSelectedConsultant(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white"
                        >
                          <option value="">Select a consultant</option>
                          {consultants.map((consultant) => (
                            <option key={consultant.id} value={consultant.id}>
                              {consultant.name} {consultant.specialization ? `- ${consultant.specialization}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {userProfile?.role === 'consultant' && (
                      <div className="bg-blue-950 p-4 rounded-lg border border-blue-800">
                        <p className="text-sm text-blue-200">
                          This patient will be marked as done and assigned to you as the consultant.
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={handleMarkAsDone} 
                      disabled={markingDone || (userProfile?.role === 'doctor' && !selectedConsultant)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <span className="text-white">{markingDone ? 'Marking as Done...' : 'Mark as Done'}</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Link to={`/patients/${patient.id}/edit`}>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="h-4 w-4" />
                <span className="text-white">Edit Patient</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-black border-gray-800">
            <CardHeader className="bg-black">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                <span className="text-white">Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-black">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-400">Age</p>
                  <p className="text-lg font-semibold text-white">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Gender</p>
                  <p className="text-lg font-semibold text-white capitalize">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <p className="text-lg font-semibold text-white">{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-400">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-lg font-semibold text-white">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="bg-gray-800" />
              
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                  <p className="text-white">{patient.address}</p>
                </div>
              </div>

              {(patient.occupation || patient.religion || patient.tribe) && (
                <>
                  <Separator className="bg-gray-800" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {patient.occupation && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">Occupation</p>
                        <p className="text-white">{patient.occupation}</p>
                      </div>
                    )}
                    {patient.religion && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">Religion</p>
                        <p className="text-white">{patient.religion}</p>
                      </div>
                    )}
                    {patient.tribe && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">Tribe</p>
                        <p className="text-white">{patient.tribe}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card className="bg-black border-gray-800">
            <CardHeader className="bg-black">
              <CardTitle className="flex items-center gap-2 text-white">
                <Stethoscope className="h-5 w-5" />
                <span className="text-white">Medical Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-black">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Diagnosis</p>
                <p className="text-white bg-gray-900 p-3 rounded-lg border border-gray-800">{patient.diagnosis}</p>
              </div>
              
              {patient.procedure && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-400">Procedure</p>
                    {userProfile && userProfile.role === 'doctor' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('pending')}
                          disabled={updatingProcedure || patient.procedureStatus === 'pending'}
                          className="text-xs bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                        >
                          <span className="text-white">Pending</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('reviewed')}
                          disabled={updatingProcedure || patient.procedureStatus === 'reviewed'}
                          className="text-xs bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                        >
                          <span className="text-white">Reviewed</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProcedureStatus('completed')}
                          disabled={updatingProcedure || patient.procedureStatus === 'completed'}
                          className="text-xs bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                        >
                          <span className="text-white">Completed</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                    <p className="text-white mb-2">{patient.procedure}</p>
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getProcedureStatusColor(patient.procedureStatus)}`}>
                        <ProcedureIcon className="h-3 w-3" />
                        <span>{patient.procedureStatus || 'pending'}</span>
                      </div>
                      {patient.procedureDate && patient.procedureStatus === 'completed' && (
                        <p className="text-xs text-gray-400">
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
                    <p className="text-sm font-medium text-gray-400">Ward</p>
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-gray-500" />
                      <p className="text-white">{getWardName(patient.wardId)}</p>
                    </div>
                  </div>
                )}
                {patient.bedNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-400">Bed Number</p>
                    <p className="text-white">{patient.bedNumber}</p>
                  </div>
                )}
              </div>

              {/* Doctor who created the patient */}
              {patient.doctorName && (
                <div className="bg-blue-950 p-3 rounded-lg border border-blue-800">
                  <p className="text-sm font-medium text-blue-200 mb-1 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-blue-200">Added by Doctor</span>
                  </p>
                  <p className="text-blue-100 font-semibold">{patient.doctorName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <Card className="bg-black border-gray-800">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-white">Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-black">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Name</p>
                    <p className="text-white font-semibold">{patient.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-white font-semibold">{patient.emergencyContact.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Relationship</p>
                    <p className="text-white font-semibold">{patient.emergencyContact.relationship}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {patient.reviews && patient.reviews.length > 0 && (
            <Card className="bg-black border-gray-800">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  <span className="text-white">Patient Reviews ({patient.reviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.reviews.map((review) => {
                    const ReviewIcon = getReviewTypeIcon(review.type);
                    return (
                      <div key={review.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ReviewIcon className="h-5 w-5 text-white" />
                            <div>
                              <h4 className="font-semibold text-white">{review.title}</h4>
                              <p className="text-xs text-gray-400">{getReviewTypeLabel(review.type)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReview(review)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {review.description && (
                          <p className="text-sm text-gray-300 mb-2">{review.description}</p>
                        )}
                        
                        {review.images.length > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-400">{review.images.length} image(s)</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="text-gray-400">by {review.createdByName}</span>
                          <span className="text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="bg-black border-gray-800">
            <CardHeader className="bg-black">
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span className="text-white">Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-black">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">Admitted</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(patient.admissionDate)}
                  </p>
                </div>
              </div>
              
              {patient.dischargeDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Discharged</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(patient.dischargeDate)}
                    </p>
                  </div>
                </div>
              )}

              {patient.procedureDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Procedure Completed</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(patient.procedureDate)}
                    </p>
                  </div>
                </div>
              )}

              {patient.status === 'done' && patient.consultantName && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Marked as Done</p>
                    <p className="text-xs text-gray-400">
                      Assigned to {patient.consultantName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biopsy Results */}
          {patient.biopsyResults && patient.biopsyResults.length > 0 && (
            <Card className="bg-black border-gray-800">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  <span className="text-white">Biopsy Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-black">
                <div className="space-y-3">
                  {patient.biopsyResults.slice(0, 3).map((result) => (
                    <div key={result.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{result.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(result.performedDate).toLocaleDateString()}
                        </p>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-300 mb-2">{result.description}</p>
                      )}
                      <p className="text-sm text-white bg-gray-800 p-2 rounded border border-gray-700">
                        {result.result}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">by {result.performedByName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointments */}
          {patient.appointments && patient.appointments.length > 0 && (
            <Card className="bg-black border-gray-800">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  <span className="text-white">Upcoming Appointments</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-black">
                <div className="space-y-3">
                  {patient.appointments
                    .filter(apt => apt.status === 'scheduled' && new Date(apt.scheduledDate) > new Date())
                    .slice(0, 3)
                    .map((appointment) => (
                    <div key={appointment.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{appointment.title}</p>
                        <Badge variant={getAppointmentStatusColor(appointment.status)} className="text-xs bg-gray-800 text-white border-gray-600">
                          <span className="text-white">{appointment.type}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-300">
                        {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">Dr. {appointment.doctorName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {patient.notes && patient.notes.length > 0 && (
            <Card className="bg-black border-gray-800">
              <CardHeader className="bg-black">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  <span className="text-white">Recent Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-black">
                <div className="space-y-3">
                  {patient.notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getNoteTypeColor(note.type)} className="text-xs bg-gray-800 text-white border-gray-600">
                          <span className="text-white">{note.type}</span>
                        </Badge>
                        <p className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-white mb-1">{note.content}</p>
                      <p className="text-xs text-gray-400">by {note.createdByName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                {React.createElement(getReviewTypeIcon(selectedReview.type), { className: "h-5 w-5" })}
                <span className="text-white">{selectedReview.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{getReviewTypeLabel(selectedReview.type)}</span>
                <span>•</span>
                <span>by {selectedReview.createdByName}</span>
                <span>•</span>
                <span>{new Date(selectedReview.createdAt).toLocaleDateString()}</span>
              </div>
              
              {selectedReview.description && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300 bg-gray-900 p-3 rounded-lg border border-gray-800">
                    {selectedReview.description}
                  </p>
                </div>
              )}
              
              {selectedReview.textContent && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Notes</h4>
                  <p className="text-gray-300 bg-gray-900 p-3 rounded-lg border border-gray-800 whitespace-pre-wrap">
                    {selectedReview.textContent}
                  </p>
                </div>
              )}
              
              {selectedReview.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Images ({selectedReview.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedReview.images.map((image) => (
                      <div key={image.id} className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="text-xs text-gray-400 truncate">{image.filename}</p>
                        <p className="text-xs text-gray-500">{(image.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}