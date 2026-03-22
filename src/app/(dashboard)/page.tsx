"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardStats, subscribeToPatients, getProcedureAnalytics } from '@/services/database';
import { DashboardStats, Patient, ProcedureAnalytics } from '@/types';
import dynamic from 'next/dynamic';

// Dynamically import recharts components to avoid SSR issues
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

export default function DashboardPage() {
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
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-900 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-900 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !procedureAnalytics) return null;

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-800/50 text-slate-400 border-slate-700';
      case 'reviewed': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
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

  const formatDate = (date: any) => {
    return new Date(date?.seconds ? date.seconds * 1000 : date).toLocaleDateString('en-US', {
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
      color: '#6b7280'
    },
    {
      name: 'Reviewed',
      value: procedureAnalytics.proceduresByStatus.reviewed,
      color: '#9ca3af'
    },
    {
      name: 'Completed',
      value: procedureAnalytics.proceduresByStatus.completed,
      color: '#ffffff'
    }
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-tight">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Patients</p>
                <p className="text-2xl font-bold text-white">{stats.admittedPatients}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Admissions Today</p>
                <p className="text-2xl font-bold text-white">{stats.admissionsToday}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Procedures Pending</p>
                <p className="text-2xl font-bold text-white">{stats.proceduresPending}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Cases Reviewed</p>
                <p className="text-2xl font-bold text-white">{stats.proceduresReviewed}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Procedures Done</p>
                <p className="text-2xl font-bold text-white">{stats.proceduresCompleted}</p>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed This Week</p>
                <p className="text-2xl font-bold text-white">{stats.proceduresCompletedThisWeek}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-white" />
                  <span className="text-xs text-gray-300">+15% trend</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        <Card className="xl:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-white text-lg">Recent Patients</CardTitle>
              <CardDescription className="text-slate-400">Latest patient admissions</CardDescription>
            </div>
            <Link href="/patients">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients.map((patient) => {
                const StatusIcon = getProcedureStatusIcon(patient.procedureStatus);
                return (
                  <div key={patient.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl hover:bg-slate-900/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-100 truncate">{patient.name}</p>
                        <Badge variant="outline" className="text-[10px] bg-slate-900 text-slate-400 border-slate-800 px-1.5 h-4">
                          Age: {patient.age}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-1">{patient.diagnosis}</p>
                      {patient.procedure && (
                        <p className="text-[11px] text-primary/80 font-medium truncate italic">Procedure: {patient.procedure}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {patient.procedure && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getProcedureStatusColor(patient.procedureStatus)} shadow-sm`}>
                          <StatusIcon className="h-3 w-3" />
                          {patient.procedureStatus || 'pending'}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-600 font-bold uppercase">{formatDate(patient.admissionDate)}</span>
                    </div>
                  </div>
                );
              })}
              {recentPatients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent patients</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Procedure Status</CardTitle>
              <CardDescription className="text-slate-400">Current pipeline distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {procedureStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={procedureStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
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

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="bg-gray-900">
              <CardTitle className="text-white">Weekly Performance</CardTitle>
              <CardDescription className="text-gray-400">Procedure completion metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-gray-900">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {procedureAnalytics.weeklyCompletionRate.length > 0 
                    ? procedureAnalytics.weeklyCompletionRate[procedureAnalytics.weeklyCompletionRate.length - 1].rate.toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-400">Completion Rate This Week</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Patients Waiting</span>
                  <span className="font-semibold text-gray-300">{procedureAnalytics.currentWaitingList}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg. Wait Time</span>
                  <span className="font-semibold text-white">{procedureAnalytics.averageWaitTime} days</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-medium text-white mb-3">Last 4 Weeks</h4>
                <div className="space-y-2">
                  {procedureAnalytics.weeklyCompletionRate.slice(-4).map((week, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{week.completed}/{week.total}</span>
                        <span className={`font-medium ${week.rate >= 80 ? 'text-white' : week.rate >= 60 ? 'text-gray-300' : 'text-gray-500'}`}>
                          {week.rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="bg-gray-900">
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-900">
              <div className="grid grid-cols-1 gap-3">
                <Link href="/patients" className="block">
                  <button className="w-full p-3 text-left border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors group bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">View Patients</p>
                        <p className="text-xs text-gray-400">Manage patient records</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/patients/new" className="block">
                  <button className="w-full p-3 text-left border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors group bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                        <UserCheck className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Add Patient</p>
                        <p className="text-xs text-gray-400">Register new patient</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/reports" className="block">
                  <button className="w-full p-3 text-left border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors group bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Analytics</p>
                        <p className="text-xs text-gray-400">View detailed reports</p>
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
