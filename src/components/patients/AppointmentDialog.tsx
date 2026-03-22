import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Appointment } from '@/types';

interface AppointmentDialogProps {
  onScheduleAppointment: (appointment: Omit<Appointment, 'id' | 'patientId' | 'doctorId' | 'doctorName' | 'createdBy' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

export function AppointmentDialog({ onScheduleAppointment, loading }: AppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    duration: 30,
    type: 'consultation' as 'consultation' | 'procedure' | 'follow-up' | 'surgery' | 'therapy'
  });

  const handleSubmit = async () => {
    if (!appointmentData.title.trim() || !appointmentData.scheduledDate) return;

    try {
      await onScheduleAppointment({
        title: appointmentData.title.trim(),
        description: appointmentData.description.trim() || undefined,
        scheduledDate: new Date(appointmentData.scheduledDate),
        duration: appointmentData.duration,
        status: 'scheduled',
        type: appointmentData.type,
      });
      
      setAppointmentData({
        title: '',
        description: '',
        scheduledDate: '',
        duration: 30,
        type: 'consultation'
      });
      setOpen(false);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
          <Calendar className="h-4 w-4" />
          <span className="text-white">Schedule Appointment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Schedule Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="appointmentTitle" className="text-slate-300 font-medium">Title</Label>
            <Input
              id="appointmentTitle"
              value={appointmentData.title}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Follow-up consultation"
              className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="appointmentType" className="text-slate-300 font-medium">Type</Label>
            <select
              id="appointmentType"
              value={appointmentData.type}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white"
            >
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
              <option value="follow-up">Follow-up</option>
              <option value="surgery">Surgery</option>
              <option value="therapy">Therapy</option>
            </select>
          </div>
          <div>
            <Label htmlFor="scheduledDate" className="text-slate-300 font-medium">Date & Time</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={appointmentData.scheduledDate}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="duration" className="text-slate-300 font-medium">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={appointmentData.duration}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              min="15"
              step="15"
              className="bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-slate-300 font-medium">Description (Optional)</Label>
            <Textarea
              id="description"
              value={appointmentData.description}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the appointment..."
              rows={3}
              className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !appointmentData.title.trim() || !appointmentData.scheduledDate}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}