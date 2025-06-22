import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardStats, subscribeToPatients, getProcedureAnalytics } from '@/services/database';
import { DashboardStats, Patient, ProcedureAnalytics } from '@/types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [procedureAnalytics, setProcedureAnalytics] = useState<ProcedureAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [dashboardStats, analytics] = await Promise.all([
          getDashboardStats(),
          getProcedureAnalytics()
        ]);
        setStats(dashboardStats);
        setProcedureAnalytics(analytics);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Subscribe to recent patients
    const unsubscribe = subscribeToPatients((patients) => {
      setRecentPatients(patients.slice(0, 8));
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !procedureAnalytics) return null;

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProcedureStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'reviewed': return FileText;
      case 'completed': return CheckCircle;
      default: return Activity;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Prepare procedure status data for pie chart
  const procedureStatusData = [
    {
      name: 'Pending',
      value: procedureAnalytics.proceduresByStatus.pending,
      color: '#f59e0b'
    },
    {
      name: 'Reviewed',
      value: procedureAnalytics.proceduresByStatus.reviewed,
      color: '#3b82f6'
    },
    {
      name: 'Completed',
      value: procedureAnalytics.proceduresByStatus.completed,
      color: '#10b981'
    }
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your hospital today.</p>
      </div>

      {/* Main Stats Grid - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Patients"
          value={stats.admittedPatients}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Admissions Today"
          value={stats.admissionsToday}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Procedure Stats Grid - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Procedures Pending"
          value={stats.proceduresPending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Cases Reviewed"
          value={stats.proceduresReviewed}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Procedures Done"
          value={stats.proceduresCompleted}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Completed This Week"
          value={stats.proceduresCompletedThisWeek}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Patients with Procedures */}
        <Card className="xl:col-span-2 bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-white">
            <div>
              <CardTitle className="text-gray-900">Recent Patients</CardTitle>
              <CardDescription className="text-gray-600">Latest patient admissions with procedure status</CardDescription>
            </div>
            <Link to="/patients">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              {recentPatients.map((patient) => {
                const StatusIcon = getProcedureStatusIcon(patient.procedureStatus);
                return (
                  <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                        <span className="text-sm text-gray-500">Age: {patient.age}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">{patient.diagnosis}</p>
                      {patient.procedure && (
                        <p className="text-sm text-blue-600 truncate">Procedure: {patient.procedure}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Admitted: {formatDate(patient.admissionDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {patient.procedure && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getProcedureStatusColor(patient.procedureStatus)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {patient.procedureStatus || 'pending'}
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {recentPatients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent patients</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Procedure Status Pie Chart */}
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Procedure Status Distribution</CardTitle>
              <CardDescription className="text-gray-600">Current procedure pipeline</CardDescription>
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

          {/* Weekly Completion Rate */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Weekly Performance</CardTitle>
              <CardDescription className="text-gray-600">Procedure completion metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {procedureAnalytics.weeklyCompletionRate.length > 0 
                    ? procedureAnalytics.weeklyCompletionRate[procedureAnalytics.weeklyCompletionRate.length - 1].rate.toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600">Completion Rate This Week</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patients Waiting</span>
                  <span className="font-semibold text-orange-600">{procedureAnalytics.currentWaitingList}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Wait Time</span>
                  <span className="font-semibold text-gray-900">{procedureAnalytics.averageWaitTime} days</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Last 4 Weeks</h4>
                <div className="space-y-2">
                  {procedureAnalytics.weeklyCompletionRate.slice(-4).map((week, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{week.completed}/{week.total}</span>
                        <span className={`font-medium ${week.rate >= 80 ? 'text-green-600' : week.rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {week.rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="grid grid-cols-1 gap-3">
                <Link to="/patients" className="block">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">View Patients</p>
                        <p className="text-xs text-gray-600">Manage patient records</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link to="/patients/new" className="block">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Add Patient</p>
                        <p className="text-xs text-gray-600">Register new patient</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link to="/reports" className="block">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Analytics</p>
                        <p className="text-xs text-gray-600">View detailed reports</p>
                      </div>
                    </div>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}