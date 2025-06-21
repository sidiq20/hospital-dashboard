import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientNote } from '@/types';

interface PatientNoteDialogProps {
  onAddNote: (note: Omit<PatientNote, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

export function PatientNoteDialog({ onAddNote, loading }: PatientNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'medical' | 'nursing' | 'administrative'>('general');

  const handleSubmit = async () => {
    if (!noteContent.trim()) return;

    try {
      await onAddNote({
        content: noteContent.trim(),
        type: noteType
      });
      
      setNoteContent('');
      setNoteType('general');
      setOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            onClick={handleSubmit} 
            disabled={loading || !noteContent.trim()}
            className="w-full"
          >
            {loading ? 'Adding Note...' : 'Add Note'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}