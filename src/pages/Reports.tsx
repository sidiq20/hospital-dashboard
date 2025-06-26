import { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Calendar,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExportDialog, ExportConfig } from '@/components/reports/ExportDialog';
import { getDashboardStats, getPatients, getWards, getProcedureAnalytics } from '@/services/database';
import { DashboardStats, Patient, Ward, ExportData } from '@/types';
import { generateCSV, generateJSON, generateExcelCSV, generatePDFHTML, downloadFile, generateFilename } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export function Reports() {
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

  const getWeeklyPatientData = () => {
    const weeks = [];
    const now = new Date();
    
    // Generate last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + (i * 7)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekPatients = patients.filter(patient => {
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate >= weekStart && admissionDate <= weekEnd;
      });
      
      weeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekStart,
        weekEnd,
        patients: weekPatients.length,
        admissions: weekPatients.length,
        discharges: weekPatients.filter(p => p.dischargeDate && 
          new Date(p.dischargeDate) >= weekStart && 
          new Date(p.dischargeDate) <= weekEnd
        ).length
      });
    }
    
    return weeks;
  };

  const getFilteredPatients = () => {
    if (weekFilter === 'all') return patients;
    
    const weeklyData = getWeeklyPatientData();
    const selectedWeek = weeklyData.find((_, index) => index.toString() === weekFilter);
    
    if (!selectedWeek) return patients;
    
    return patients.filter(patient => {
      const admissionDate = new Date(patient.admissionDate);
      return admissionDate >= selectedWeek.weekStart && admissionDate <= selectedWeek.weekEnd;
    });
  };

  const getProcedureStatusData = () => {
    const filteredPatients = getFilteredPatients();
    const patientsWithProcedures = filteredPatients.filter(p => p.procedure);
    
    const statusCounts = {
      pending: patientsWithProcedures.filter(p => p.procedureStatus === 'pending' || !p.procedureStatus).length,
      reviewed: patientsWithProcedures.filter(p => p.procedureStatus === 'reviewed').length,
      completed: patientsWithProcedures.filter(p => p.procedureStatus === 'completed').length
    };

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: getProcedureStatusColor(status)
      }));
  };

  const getAdmissionTrends = () => {
    return getWeeklyPatientData();
  };

  const getDepartmentStats = () => {
    const filteredPatients = getFilteredPatients();
    const departmentCounts = wards.reduce((acc, ward) => {
      // Count patients in each department
      const patientsInWard = filteredPatients.filter(p => p.wardId === ward.id && p.status === 'active').length;
      acc[ward.department] = (acc[ward.department] || 0) + patientsInWard;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(departmentCounts)
      .map(([department, patients]) => ({ department, patients }))
      .sort((a, b) => b.patients - a.patients);
  };

  const getProcedureStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#6b7280',
      reviewed: '#9ca3af',
      completed: '#ffffff'
    };
    return colors[status] || '#6b7280';
  };

  const handleExport = async (config: ExportConfig) => {
    setExporting(true);
    
    try {
      // Filter patients based on date range
      const filteredPatients = patients.filter(patient => {
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate >= config.dateRange.start && admissionDate <= config.dateRange.end;
      });

      // Get procedure analytics for the date range
      const procedureAnalytics = await getProcedureAnalytics();

      const exportData: ExportData = {
        patients: filteredPatients,
        wards,
        stats: stats!,
        procedureAnalytics,
        exportDate: new Date(),
        dateRange: config.dateRange
      };

      const filename = generateFilename(config);
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (config.format) {
        case 'csv':
          content = generateCSV(exportData, config);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'excel':
          content = generateExcelCSV(exportData, config);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'json':
          content = generateJSON(exportData, config);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'pdf':
          content = generatePDFHTML(exportData, config);
          mimeType = 'text/html';
          extension = 'html';
          break;
        default:
          throw new Error('Unsupported format');
      }

      downloadFile(content, `${filename}.${extension}`, mimeType);
      
      toast.success(`Report exported successfully as ${config.format.toUpperCase()}`);
      
      if (config.format === 'pdf') {
        toast.info('HTML file downloaded. Open it in a browser and print to PDF for best results.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#ffffff', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const procedureStatusData = getProcedureStatusData();
  const admissionTrends = getAdmissionTrends();
  const departmentStats = getDepartmentStats();
  const filteredPatients = getFilteredPatients();
  const weeklyData = getWeeklyPatientData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400">Comprehensive insights into hospital operations and performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            >
              <option value="all">All Time</option>
              {weeklyData.map((week, index) => (
                <option key={index} value={index.toString()}>
                  Week of {week.week}
                </option>
              ))}
            </select>
          </div>
          <ExportDialog onExport={handleExport} loading={exporting} />
          <Button variant="outline" className="flex items-center gap-2 bg-white text-black border-gray-300 hover:bg-gray-100">
            <RefreshCw className="h-4 w-4" />
            <span className="text-black">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {weekFilter === 'all' ? 'Total Patients' : 'Patients This Week'}
                </p>
                <p className="text-2xl font-bold text-white">{filteredPatients.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Patients</p>
                <p className="text-2xl font-bold text-white">
                  {filteredPatients.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed Cases</p>
                <p className="text-2xl font-bold text-white">
                  {filteredPatients.filter(p => p.status === 'done').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Wards</p>
                <p className="text-2xl font-bold text-white">{wards.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Procedure Status Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="bg-gray-900">
            <CardTitle className="text-white">
              Procedure Status Distribution
              {weekFilter !== 'all' && (
                <Badge variant="outline" className="ml-2 bg-gray-800 text-gray-300 border-gray-600">
                  Week of {weeklyData[parseInt(weekFilter)]?.week}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-900">
            {procedureStatusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={procedureStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {procedureStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400">No procedures to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ward Information */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="bg-gray-900">
            <CardTitle className="text-white">Ward Information</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-900">
            <div className="space-y-4">
              {wards.map((ward, index) => (
                <div key={ward.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <span className="font-medium text-white">{ward.name}</span>
                      <p className="text-sm text-gray-400">{ward.department}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="min-w-[4rem] justify-center bg-gray-700 text-gray-300 border-gray-600">
                    {ward.wardType}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Admission Trends */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="bg-gray-900">
            <CardTitle className="text-white">Weekly Patient Admissions (Last 8 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-900">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={admissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="admissions" 
                    stackId="1" 
                    stroke="#ffffff" 
                    fill="#ffffff" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="discharges" 
                    stackId="2" 
                    stroke="#9ca3af" 
                    fill="#9ca3af" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="bg-gray-900">
            <CardTitle className="text-white">
              Patients by Department
              {weekFilter !== 'all' && (
                <Badge variant="outline" className="ml-2 bg-gray-800 text-gray-300 border-gray-600">
                  Week of {weeklyData[parseInt(weekFilter)]?.week}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-900">
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-white">{dept.department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress 
                        value={(dept.patients / Math.max(...departmentStats.map(d => d.patients), 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <Badge variant="outline" className="min-w-[3rem] justify-center bg-gray-800 text-gray-300 border-gray-600">
                      {dept.patients}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}