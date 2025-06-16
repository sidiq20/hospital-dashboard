import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Building2, 
  Percent,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardStats, subscribeToPatients } from '@/services/database';
import { DashboardStats, Patient } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Subscribe to recent patients
    const unsubscribe = subscribeToPatients((patients) => {
      setRecentPatients(patients.slice(0, 5));
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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

  if (!stats) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'default';
      case 'discharged': return 'secondary';
      case 'critical': return 'destructive';
      case 'stable': return 'secondary';
      case 'in-treatment': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your hospital today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Admitted"
          value={stats.admittedPatients}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Critical"
          value={stats.criticalPatients}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate.toFixed(1)}%`}
          icon={Percent}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Wards"
          value={stats.totalWards}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Admissions Today"
          value={stats.admissionsToday}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Discharges Today"
          value={stats.dischargesToday}
          icon={TrendingDown}
          color="yellow"
        />
        <StatCard
          title="Discharged Total"
          value={stats.dischargedPatients}
          icon={UserX}
          color="green"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Latest patient admissions</CardDescription>
            </div>
            <Link to="/patients">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                    <p className="text-sm text-gray-600 truncate">{patient.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge 
                      variant={getStatusColor(patient.status)}
                      className="text-xs"
                    >
                      {patient.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentPatients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent patients</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/patients" className="block">
                <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">View Patients</p>
                  <p className="text-sm text-gray-600">Manage patient records</p>
                </button>
              </Link>
              
              <Link to="/patients/new" className="block">
                <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900">Add Patient</p>
                  <p className="text-sm text-gray-600">Register new patient</p>
                </button>
              </Link>
              
              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                </div>
                <p className="font-medium text-gray-900">Emergency</p>
                <p className="text-sm text-gray-600">Critical patient alerts</p>
              </button>
              
              <button className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <p className="font-medium text-gray-900">Reports</p>
                <p className="text-sm text-gray-600">View analytics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}