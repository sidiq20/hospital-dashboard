"use client";

import { useEffect, useState } from 'react';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Patient, PatientNote, Appointment, BiopsyResult, PatientReview, Ward, User as UserType, ProcedureChecklist } from '@/types';
import { getPatient, addPatientNote, scheduleAppointment, addBiopsyResult, addPatientReview, getWards, updatePatient, getUsers, getProcedureChecklists } from '@/services/database';
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

export default function PatientDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { userProfile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [consultants, setConsultants] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [schedulingAppointment, setSchedulingAppointment] = useState(false);
  const [addingBiopsyResult, setAddingBiopsyResult] = useState(false);
  const [addingReview, setAddingReview] = useState(false);
  const [checklists, setChecklists] = useState<ProcedureChecklist[]>([]);
  const [updatingProcedure, setUpdatingProcedure] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [markDoneDialogOpen, setMarkDoneDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [selectedReview, setSelectedReview] = useState<PatientReview | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const [patientData, wardsData, usersData, checklistsData] = await Promise.all([
          getPatient(id),
          getWards(),
          getUsers(),
          getProcedureChecklists(id)
        ]);
        setPatient(patientData);
        setWards(wardsData);
        setConsultants(usersData.filter(user => user.role === 'consultant'));
        setChecklists(checklistsData);
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
        updates.consultantId = userProfile.id;
        updates.consultantName = userProfile.name;
      }

      await updatePatient(patient.id, updates);
      
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

  const formatDate = (date: any) => {
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-900 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-slate-900 rounded"></div>
              <div className="h-48 bg-slate-900 rounded"></div>
            </div>
            <div className="h-96 bg-slate-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
        <div className="text-center py-12">
          <p className="text-slate-400">Patient not found</p>
          <Button onClick={() => router.push('/patients')} className="mt-4 bg-primary hover:bg-primary/90 text-white">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(patient.status);
  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/patients')}
          className="mb-4 text-slate-400 hover:text-white hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-slate-400">Back to Patients</span>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusColor(patient.status) as any} className="flex items-center gap-1 bg-gray-800 text-white border-gray-600">
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
            <PatientNoteDialog onAddNote={handleAddNote} loading={addingNote} />
            <AppointmentDialog onScheduleAppointment={handleScheduleAppointment} loading={schedulingAppointment} />
            <BiopsyResultDialog onAddBiopsyResult={handleAddBiopsyResult} loading={addingBiopsyResult} />
            <PatientReviewDialog onAddReview={handleAddReview} loading={addingReview} />

            {patient.status !== 'done' && (
              <Dialog open={markDoneDialogOpen} onOpenChange={setMarkDoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-white">Mark as Done</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Mark Patient as Done</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {userProfile?.role === 'doctor' && (
                      <div>
                        <Label htmlFor="consultant">Assign to Consultant</Label>
                        <select
                          id="consultant"
                          value={selectedConsultant}
                          onChange={(e) => setSelectedConsultant(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white mt-1"
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
                      <span>{markingDone ? 'Marking as Done...' : 'Mark as Done'}</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Link href={`/patients/${patient.id}/edit`}>
              <Button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                <Edit className="h-4 w-4" />
                <span className="text-white">Edit Patient</span>
              </Button>
            </Link>

            <Link href={`/patients/${patient.id}/checklist/new`}>
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white">
                <FileText className="h-4 w-4" />
                <span className="text-white">New Checklist</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Stethoscope className="h-5 w-5" />
                <span>Medical Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Diagnosis</p>
                <div className="bg-black p-3 rounded-lg border border-gray-800 text-white">{patient.diagnosis}</div>
              </div>
              {patient.procedure && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-400">Procedure</p>
                    {userProfile?.role === 'doctor' && (
                      <div className="flex gap-1">
                        {['pending', 'reviewed', 'completed'].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateProcedureStatus(status as any)}
                            disabled={updatingProcedure || patient.procedureStatus === status}
                            className="text-xs bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                          >
                            <span className="capitalize">{status}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-gray-800">
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
              {patient.doctorName && (
                <div className="bg-blue-950/50 p-3 rounded-lg border border-blue-900">
                  <p className="text-sm font-medium text-blue-200 mb-1 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Added by Doctor</span>
                  </p>
                  <p className="text-blue-100 font-semibold">{patient.doctorName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {patient.emergencyContact && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertCircle className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Name</p>
                    <p className="text-white font-semibold">{patient.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Phone</p>
                    <p className="text-white font-semibold">{patient.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Relationship</p>
                    <p className="text-white font-semibold">{patient.emergencyContact.relationship}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {patient.reviews && patient.reviews.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  <span>Patient Reviews ({patient.reviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.reviews.map((review) => {
                    const ReviewIcon = getReviewTypeIcon(review.type);
                    return (
                      <div key={review.id} className="bg-black p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ReviewIcon className="h-5 w-5 text-white" />
                            <div>
                              <h4 className="font-semibold text-white">{review.title}</h4>
                              <p className="text-xs text-gray-400">{getReviewTypeLabel(review.type)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReview(review)} className="text-gray-400 hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        {review.description && <p className="text-sm text-gray-300 mb-2 truncate">{review.description}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>by {review.createdByName}</span>
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {checklists && checklists.length > 0 && (
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Procedure Checklists ({checklists.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checklists.map((checklist) => (
                    <Link 
                      key={checklist.id} 
                      href={`/patients/${patient.id}/checklist/${checklist.id}`}
                      className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 hover:border-primary/50 hover:bg-slate-900/50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 group-hover:text-primary transition-colors">{checklist.procedure}</h4>
                            <p className="text-xs text-slate-500">{checklist.indication}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        <span>by {checklist.createdByName}</span>
                        <span>{formatDate(checklist.date)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Admitted</p>
                  <p className="text-xs text-gray-400">{formatDate(patient.admissionDate)}</p>
                </div>
              </div>
              {patient.procedureDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Procedure Completed</p>
                    <p className="text-xs text-gray-400">{formatDate(patient.procedureDate)}</p>
                  </div>
                </div>
              )}
              {patient.dischargeDate && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Discharged</p>
                    <p className="text-xs text-gray-400">{formatDate(patient.dischargeDate)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
