import { useState } from 'react';
import { FileText, Upload, X, Image as ImageIcon, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PatientReview } from '@/types';

interface PatientReviewDialogProps {
  onAddReview: (review: Omit<PatientReview, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

const reviewTypes = [
  { value: 'ct_images', label: 'CT Images', icon: ImageIcon, description: 'Computed Tomography scans' },
  { value: 'mri_images', label: 'MRI Images', icon: ImageIcon, description: 'Magnetic Resonance Imaging' },
  { value: 'ultrasound_images', label: 'Ultrasound Images', icon: ImageIcon, description: 'Ultrasound scans' },
  { value: 'blood_tests', label: 'Blood Tests', icon: FileText, description: 'Laboratory blood work results' },
  { value: 'inr', label: 'INR', icon: FileText, description: 'International Normalized Ratio' }
];

export function PatientReviewDialog({ onAddReview, loading }: PatientReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    title: '',
    description: '',
    textContent: ''
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const typeLabel = reviewTypes.find(t => t.value === type)?.label || '';
    setReviewData(prev => ({ ...prev, title: typeLabel }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('Please select only image files');
      return;
    }
    
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType || !reviewData.title.trim()) return;

    try {
      // Show warning about image storage
      if (selectedImages.length > 0) {
        alert('Note: Images cannot be saved - server space not found. Only text content will be saved.');
      }

      // Don't include images in the review since we can't store them
      await onAddReview({
        type: selectedType as any,
        title: reviewData.title.trim(),
        description: reviewData.description.trim() || undefined,
        images: [], // Empty array since we can't store images
        textContent: reviewData.textContent.trim() || undefined
      });
      
      // Reset form
      setSelectedType(null);
      setReviewData({ title: '', description: '', textContent: '' });
      setSelectedImages([]);
      setOpen(false);
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setReviewData({ title: '', description: '', textContent: '' });
    setSelectedImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
          <FileText className="h-4 w-4" />
          <span className="text-white">Add Review</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-xl">
            <FileText className="h-5 w-5" />
            Add Patient Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!selectedType ? (
            // Type Selection - List Style
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Select Review Type</h3>
              <div className="space-y-3">
                {reviewTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className="cursor-pointer transition-all duration-200 hover:shadow-md bg-slate-950 border-slate-800 hover:border-blue-700 hover:bg-slate-900"
                      onClick={() => handleTypeSelect(type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{type.label}</h4>
                              <p className="text-sm text-slate-400">{type.description}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            // Review Form
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {reviewTypes.find(t => t.value === selectedType)?.label} Review
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Change Type
                </Button>
              </div>

              {/* Image Storage Warning - Red background */}
              <Alert className="border-red-900 bg-red-950/20 border-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200 font-medium">
                  <strong>Note:</strong> Image storage is currently unavailable. Only text content will be saved.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reviewTitle" className="text-slate-300 font-medium">Title *</Label>
                    <Input
                      id="reviewTitle"
                      value={reviewData.title}
                      onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter review title"
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewDescription" className="text-slate-300 font-medium">Description</Label>
                    <Textarea
                      id="reviewDescription"
                      value={reviewData.description}
                      onChange={(e) => setReviewData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description or notes..."
                      rows={3}
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewContent" className="text-slate-300 font-medium">Additional Notes</Label>
                    <Textarea
                      id="reviewContent"
                      value={reviewData.textContent}
                      onChange={(e) => setReviewData(prev => ({ ...prev, textContent: e.target.value }))}
                      placeholder="Enter detailed findings, observations, or results..."
                      rows={4}
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300 font-medium">Images (Currently Unavailable)</Label>
                    <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center bg-slate-950">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                        disabled
                      />
                      <label htmlFor="image-upload" className="cursor-not-allowed">
                        <Upload className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">
                          Image upload temporarily disabled
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          Server space not found
                        </p>
                      </label>
                    </div>
                  </div>

                  {selectedImages.length > 0 && (
                    <div>
                      <Label className="text-slate-300 font-medium">Selected Images ({selectedImages.length})</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-white truncate">{file.name}</span>
                              <span className="text-xs text-slate-500">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !reviewData.title.trim()}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {loading ? 'Adding Review...' : 'Add Review'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}