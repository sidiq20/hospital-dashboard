"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Users, 
  Building2, 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportDialog, ExportConfig } from '@/components/reports/ExportDialog';
import { getDashboardStats, getPatients, getWards, getProcedureAnalytics } from '@/services/database';
import { DashboardStats, Patient, Ward, ExportData } from '@/types';
import { generateCSV, generateJSON, downloadFile, generateFilename } from '@/utils/exportUtils';
import { toast } from 'sonner';

// Dynamic imports for recharts
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [weekFilter, setWeekFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardStats, patientsData, wardsData] = await Promise.all([
          getDashboardStats(),
          getPatients(),
          getWards()
        ]);
        setStats(dashboardStats);
        setPatients(patientsData);
        setWards(wardsData);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const COLORS = ['#ffffff', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'];

  if (loading || !stats) return <div className="p-8"><div className="animate-pulse h-8 bg-gray-800 rounded w-1/4 mb-6"></div></div>;

  const procedureStatusData = [
    { name: 'Pending', value: patients.filter(p => (p.procedureStatus === 'pending' || !p.procedureStatus) && p.procedure).length, color: '#6b7280' },
    { name: 'Reviewed', value: patients.filter(p => p.procedureStatus === 'reviewed').length, color: '#9ca3af' },
    { name: 'Completed', value: patients.filter(p => p.procedureStatus === 'completed').length, color: '#ffffff' }
  ].filter(d => d.value > 0);

  const handleExport = async (config: ExportConfig) => {
    setExporting(true);
    try {
      const filteredPatients = patients.filter(p => {
        const d = new Date(p.admissionDate);
        return d >= config.dateRange.start && d <= config.dateRange.end;
      });
      const procedureAnalytics = await getProcedureAnalytics();
      const exportData: ExportData = { patients: filteredPatients, wards, stats, procedureAnalytics, exportDate: new Date(), dateRange: config.dateRange };
      const filename = generateFilename(config);
      let content = config.format === 'csv' ? generateCSV(exportData, config) : generateJSON(exportData, config);
      downloadFile(content, `${filename}.${config.format}`, config.format === 'csv' ? 'text/csv' : 'application/json');
      toast.success('Exported successfully');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Hospital operations and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <ExportDialog onExport={handleExport} loading={exporting} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <p className="text-gray-400 text-sm">Total Patients</p>
            <p className="text-2xl font-bold text-white">{patients.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <p className="text-gray-400 text-sm">Active Wards</p>
            <p className="text-2xl font-bold text-white">{wards.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white">Procedure Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={procedureStatusData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name}) => name}>
                    {procedureStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white">Ward Occupancy</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wards.slice(0, 5).map((w, i) => (
                <div key={w.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.department}</p>
                  </div>
                  <Badge variant="outline" className="bg-gray-700 text-white border-gray-600">{w.wardType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
