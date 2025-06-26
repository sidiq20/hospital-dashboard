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
        <Button variant="outline" className="flex items-center gap-2 bg-white text-white border-gray-300 hover:bg-gray-100">
          <FileText className="h-4 w-4" />
          <span className="text-white">Add Review</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black text-xl">
            <FileText className="h-5 w-5" />
            Add Patient Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!selectedType ? (
            // Type Selection - List Style
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Select Review Type</h3>
              <div className="space-y-3">
                {reviewTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className="cursor-pointer transition-all duration-200 hover:shadow-md bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleTypeSelect(type.value)}
                    >
                      <CardContent className="p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-black">{type.label}</h4>
                              <p className="text-sm text-gray-600">{type.description}</p>
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
                <h3 className="text-lg font-semibold text-black">
                  {reviewTypes.find(t => t.value === selectedType)?.label} Review
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="text-gray-600 hover:text-black hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Change Type
                </Button>
              </div>

              {/* Image Storage Warning - Red background */}
              <Alert className="border-red-500 bg-black border-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">
                  <strong>Note:</strong> Image storage is currently unavailable. Only text content will be saved.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reviewTitle" className="text-black font-medium">Title *</Label>
                    <Input
                      id="reviewTitle"
                      value={reviewData.title}
                      onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter review title"
                      className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewDescription" className="text-black font-medium">Description</Label>
                    <Textarea
                      id="reviewDescription"
                      value={reviewData.description}
                      onChange={(e) => setReviewData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description or notes..."
                      rows={3}
                      className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewContent" className="text-black font-medium">Additional Notes</Label>
                    <Textarea
                      id="reviewContent"
                      value={reviewData.textContent}
                      onChange={(e) => setReviewData(prev => ({ ...prev, textContent: e.target.value }))}
                      placeholder="Enter detailed findings, observations, or results..."
                      rows={4}
                      className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-black font-medium">Images (Currently Unavailable)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
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
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          Image upload temporarily disabled
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Server space not found
                        </p>
                      </label>
                    </div>
                  </div>

                  {selectedImages.length > 0 && (
                    <div>
                      <Label className="text-black font-medium">Selected Images ({selectedImages.length})</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-black truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
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

              <div className="flex gap-3 pt-4 border-t border-gray-200">
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
                  className="bg-white text-black border-gray-300 hover:bg-gray-100"
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