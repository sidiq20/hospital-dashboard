import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BiopsyResult } from '@/types';

interface BiopsyResultDialogProps {
  onAddBiopsyResult: (result: Omit<BiopsyResult, 'id' | 'performedBy' | 'performedByName' | 'performedDate' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

export function BiopsyResultDialog({ onAddBiopsyResult, loading }: BiopsyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [resultData, setResultData] = useState({
    title: '',
    description: '',
    result: ''
  });

  const handleSubmit = async () => {
    if (!resultData.title.trim() || !resultData.result.trim()) return;

    try {
      await onAddBiopsyResult({
        title: resultData.title.trim(),
        description: resultData.description.trim() || undefined,
        result: resultData.result.trim()
      });
      
      setResultData({
        title: '',
        description: '',
        result: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding biopsy result:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white text-white border-gray-300 hover:bg-gray-100">
          <FileText className="h-4 w-4" />
          Add Biopsy Result
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="text-black">Add Biopsy Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="biopsyTitle" className="text-black font-medium">Title</Label>
            <Input
              id="biopsyTitle"
              value={resultData.title}
              onChange={(e) => setResultData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Liver Biopsy, Skin Biopsy"
              className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="biopsyDescription" className="text-black font-medium">Description (Optional)</Label>
            <Textarea
              id="biopsyDescription"
              value={resultData.description}
              onChange={(e) => setResultData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the biopsy procedure..."
              rows={3}
              className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="biopsyResult" className="text-black font-medium">Result</Label>
            <Textarea
              id="biopsyResult"
              value={resultData.result}
              onChange={(e) => setResultData(prev => ({ ...prev, result: e.target.value }))}
              placeholder="Enter the biopsy result findings..."
              rows={4}
              className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !resultData.title.trim() || !resultData.result.trim()}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Adding Result...' : 'Add Biopsy Result'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}