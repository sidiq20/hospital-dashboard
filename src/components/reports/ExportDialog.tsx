import { useState } from 'react';
import { Download, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExportDialogProps {
  onExport: (config: ExportConfig) => Promise<void>;
  loading: boolean;
}

export interface ExportConfig {
  dateRange: {
    start: Date;
    end: Date;
    type: 'day' | 'week' | 'month' | 'year' | 'custom';
  };
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  sections: {
    overview: boolean;
    patients: boolean;
    procedures: boolean;
    wards: boolean;
    analytics: boolean;
  };
}

export function ExportDialog({ onExport, loading }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
      type: 'month'
    },
    format: 'pdf',
    includeCharts: true,
    sections: {
      overview: true,
      patients: true,
      procedures: true,
      wards: true,
      analytics: true
    }
  });

  const handleDateRangeChange = (type: ExportConfig['dateRange']['type']) => {
    const now = new Date();
    let start = new Date();
    
    switch (type) {
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        // Keep current dates for custom
        setConfig(prev => ({
          ...prev,
          dateRange: { ...prev.dateRange, type }
        }));
        return;
    }
    
    setConfig(prev => ({
      ...prev,
      dateRange: { start, end: now, type }
    }));
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setConfig(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [field]: date
        }
      }));
    }
  };

  const handleExport = async () => {
    try {
      await onExport(config);
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Comprehensive report with charts' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Data tables and analysis' },
    { value: 'csv', label: 'CSV Data', icon: FileText, description: 'Raw data for analysis' },
    { value: 'json', label: 'JSON Data', icon: FileText, description: 'Structured data format' }
  ];

  const dateRangeOptions = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Hospital Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dateRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={config.dateRange.type === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange(option.value as any)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              
              {config.dateRange.type === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={config.dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={config.dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Selected Range:</strong> {config.dateRange.start.toLocaleDateString()} - {config.dateRange.end.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        config.format === format.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, format: format.value as any }))}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">{format.label}</h4>
                          <p className="text-sm text-gray-600">{format.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Report Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(config.sections).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {key === 'analytics' ? 'Analytics & Charts' : key}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'overview' && 'Summary statistics and key metrics'}
                        {key === 'patients' && 'Patient records and demographics'}
                        {key === 'procedures' && 'Procedure status and completion rates'}
                        {key === 'wards' && 'Ward information and occupancy'}
                        {key === 'analytics' && 'Charts, trends, and detailed analysis'}
                      </p>
                    </div>
                    <Button
                      variant={enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        sections: { ...prev.sections, [key]: !enabled }
                      }))}
                    >
                      {enabled ? 'Included' : 'Excluded'}
                    </Button>
                  </div>
                ))}
              </div>
              
              {config.format === 'pdf' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Include Charts & Graphs</h4>
                      <p className="text-sm text-gray-600">Add visual charts to the PDF report</p>
                    </div>
                    <Button
                      variant={config.includeCharts ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConfig(prev => ({ ...prev, includeCharts: !prev.includeCharts }))}
                    >
                      {config.includeCharts ? 'Yes' : 'No'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Format:</strong> {formatOptions.find(f => f.value === config.format)?.label}</p>
                <p><strong>Date Range:</strong> {config.dateRange.start.toLocaleDateString()} - {config.dateRange.end.toLocaleDateString()}</p>
                <p><strong>Sections:</strong> {Object.values(config.sections).filter(Boolean).length} of {Object.keys(config.sections).length} included</p>
                {config.format === 'pdf' && (
                  <p><strong>Charts:</strong> {config.includeCharts ? 'Included' : 'Not included'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}