import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
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
      pending: '#f59e0b',
      reviewed: '#3b82f6',
      completed: '#10b981'
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
    <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into hospital operations and performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  {weekFilter === 'all' ? 'Total Patients' : 'Patients This Week'}
                </p>
                <p className="text-2xl font-bold text-blue-900">{filteredPatients.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    {weekFilter === 'all' ? '+12% from last month' : 'This week'}
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Patients</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredPatients.filter(p => p.status === 'active').length}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Currently active</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Completed Cases</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {filteredPatients.filter(p => p.status === 'done').length}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Cases done</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Wards</p>
                <p className="text-2xl font-bold text-purple-900">{wards.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Available</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Procedure Status Distribution */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">
              Procedure Status Distribution
              {weekFilter !== 'all' && (
                <Badge variant="outline" className="ml-2">
                  Week of {weeklyData[parseInt(weekFilter)]?.week}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
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
                <p className="text-gray-500">No procedures to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ward Information */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">Ward Information</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              {wards.map((ward, index) => (
                <div key={ward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <span className="font-medium text-gray-900">{ward.name}</span>
                      <p className="text-sm text-gray-600">{ward.department}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="min-w-[4rem] justify-center">
                    {ward.wardType}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Admission Trends */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">Weekly Patient Admissions (Last 8 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={admissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="admissions" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="discharges" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">
              Patients by Department
              {weekFilter !== 'all' && (
                <Badge variant="outline" className="ml-2">
                  Week of {weeklyData[parseInt(weekFilter)]?.week}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-900">{dept.department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress 
                        value={(dept.patients / Math.max(...departmentStats.map(d => d.patients), 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <Badge variant="outline" className="min-w-[3rem] justify-center">
                      {dept.patients}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-lg text-gray-900">Average Length of Stay</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">5.2</p>
              <p className="text-sm text-gray-600">days</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">-0.3 days from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-lg text-gray-900">Procedure Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">92.5%</p>
              <p className="text-sm text-gray-600">completed on time</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+2.1% from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-lg text-gray-900">Patient Satisfaction</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">4.7</p>
              <p className="text-sm text-gray-600">out of 5.0</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+0.2 from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}