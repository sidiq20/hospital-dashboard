import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getDashboardStats, getPatients, getWards } from '@/services/database';
import { DashboardStats, Patient, Ward } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

export function Reports() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

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

  const getPatientStatusData = () => {
    const statusCounts = patients.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getWardOccupancyData = () => {
    return wards.map(ward => ({
      name: ward.name,
      occupancy: ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0,
      occupied: ward.occupiedBeds,
      total: ward.totalBeds,
      available: ward.totalBeds - ward.occupiedBeds
    }));
  };

  const getAdmissionTrends = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const admissions = patients.filter(patient => {
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate >= dayStart && admissionDate <= dayEnd;
      }).length;

      const discharges = patients.filter(patient => {
        if (!patient.dischargeDate) return false;
        const dischargeDate = new Date(patient.dischargeDate);
        return dischargeDate >= dayStart && dischargeDate <= dayEnd;
      }).length;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        admissions,
        discharges
      };
    });
  };

  const getDepartmentStats = () => {
    const departmentCounts = wards.reduce((acc, ward) => {
      acc[ward.department] = (acc[ward.department] || 0) + ward.occupiedBeds;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(departmentCounts)
      .map(([department, patients]) => ({ department, patients }))
      .sort((a, b) => b.patients - a.patients);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      admitted: '#3b82f6',
      discharged: '#10b981',
      critical: '#ef4444',
      stable: '#8b5cf6',
      'in-treatment': '#f59e0b',
      review: '#6b7280',
      procedure: '#ec4899',
      done: '#14b8a6'
    };
    return colors[status] || '#6b7280';
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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

  const patientStatusData = getPatientStatusData();
  const wardOccupancyData = getWardOccupancyData();
  const admissionTrends = getAdmissionTrends();
  const departmentStats = getDepartmentStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into hospital operations and performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
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
                <p className="text-sm font-medium text-blue-700">Total Patients</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalPatients}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12% from last month</span>
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
                <p className="text-sm font-medium text-green-700">Occupancy Rate</p>
                <p className="text-2xl font-bold text-green-900">{stats.occupancyRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+5% from last week</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Admissions Today</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.admissionsToday}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">-3% from yesterday</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Critical Patients</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalPatients}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">-2 from yesterday</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-red-200 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Patient Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={patientStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ward Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Ward Occupancy Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardOccupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'occupancy' ? `${value}%` : value,
                      name === 'occupancy' ? 'Occupancy Rate' : name
                    ]}
                  />
                  <Bar dataKey="occupancy" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Admission Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Admission & Discharge Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={admissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
        <Card>
          <CardHeader>
            <CardTitle>Patients by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{dept.department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress 
                        value={(dept.patients / Math.max(...departmentStats.map(d => d.patients))) * 100} 
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Length of Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">5.2</p>
              <p className="text-sm text-gray-600">days</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">-0.3 days from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Readmission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">8.5%</p>
              <p className="text-sm text-gray-600">within 30 days</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">+1.2% from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
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