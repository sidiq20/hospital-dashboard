import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, FileText, CheckCircle, Activity, UserCheck, Calendar } from 'lucide-react';
import { Patient, Ward } from '@/types';
import { subscribeToPatients, getWards } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export function MyCases() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureFilter, setProcedureFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWards = async () => {
      try {
        const wardsData = await getWards();
        setWards(wardsData);
      } catch (error) {
        console.error('Error loading wards:', error);
      }
    };

    loadWards();

    const unsubscribe = subscribeToPatients((allPatients) => {
      // Filter patients assigned to current consultant
      if (userProfile) {
        const myCases = allPatients.filter(patient => 
          patient.consultantId === userProfile.id && patient.status === 'done'
        );
        setPatients(myCases);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        (patient.procedure && patient.procedure.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.doctorName && patient.doctorName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (procedureFilter !== 'all') {
      if (procedureFilter === 'has-procedure') {
        filtered = filtered.filter(patient => patient.procedure);
      } else if (procedureFilter === 'no-procedure') {
        filtered = filtered.filter(patient => !patient.procedure);
      } else {
        filtered = filtered.filter(patient => patient.procedureStatus === procedureFilter);
      }
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, procedureFilter]);

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const getProcedureStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRowBackgroundColor = (patient: Patient) => {
    // If patient has no procedure, use default styling
    if (!patient.procedure) {
      return 'hover:bg-gray-50 bg-white';
    }

    // Color-code based on procedure status
    switch (patient.procedureStatus) {
      case 'pending':
        return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400';
      case 'reviewed':
        return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-400';
      case 'completed':
        return 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400';
      default:
        return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400'; // Default to pending style
    }
  };

  const getCellBackgroundColor = (patient: Patient) => {
    // If patient has no procedure, use default styling
    if (!patient.procedure) {
      return 'bg-white';
    }

    // Color-code based on procedure status
    switch (patient.procedureStatus) {
      case 'pending':
        return 'bg-yellow-50';
      case 'reviewed':
        return 'bg-blue-50';
      case 'completed':
        return 'bg-green-50';
      default:
        return 'bg-yellow-50'; // Default to pending style
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

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? `${ward.name} - ${ward.department}` : 'Not assigned';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Cases</h1>
          <p className="text-gray-600">Patients assigned to you as consultant</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
              <p className="text-sm text-gray-600">Total Cases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {patients.filter(p => p.procedure && p.procedureStatus === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed Procedures</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {patients.filter(p => p.procedure && p.procedureStatus === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending Procedures</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {patients.filter(p => !p.procedure).length}
              </p>
              <p className="text-sm text-gray-600">No Procedures</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Legend */}
      <Card className="mb-6 bg-white border border-gray-200">
        <CardHeader className="bg-white pb-3">
          <CardTitle className="text-gray-900 text-sm">Procedure Status Color Guide</CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-0">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-gray-700">Pending Procedures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span className="text-gray-700">Reviewed Procedures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-gray-700">Completed Procedures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-700">No Procedure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, diagnosis, procedure, doctor, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={procedureFilter}
              onChange={(e) => setProcedureFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">All Procedures</option>
              <option value="has-procedure">Has Procedure</option>
              <option value="no-procedure">No Procedure</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Patient Info</TableHead>
                  <TableHead className="hidden sm:table-cell">Age</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Diagnosis</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[200px]">Procedure</TableHead>
                  <TableHead className="hidden xl:table-cell">Doctor</TableHead>
                  <TableHead className="hidden xl:table-cell">Admission Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const ProcedureIcon = getProcedureStatusIcon(patient.procedureStatus);
                  
                  return (
                    <TableRow 
                      key={patient.id} 
                      className={`cursor-pointer transition-all duration-200 ${getRowBackgroundColor(patient)}`}
                      onClick={() => handleRowClick(patient.id)}
                    >
                      <TableCell className={`font-medium ${getCellBackgroundColor(patient)}`}>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600 sm:hidden">Age: {patient.age}</p>
                          <p className="text-sm text-gray-600">{patient.phone}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Done
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`hidden sm:table-cell ${getCellBackgroundColor(patient)}`}>{patient.age}</TableCell>
                      <TableCell className={`hidden md:table-cell ${getCellBackgroundColor(patient)}`}>
                        <div className="max-w-xs">
                          <p className="truncate font-medium" title={patient.diagnosis}>
                            {patient.diagnosis}
                          </p>
                          {patient.wardId && (
                            <p className="text-xs text-gray-500 truncate">
                              {getWardName(patient.wardId)}
                              {patient.bedNumber && ` - Bed ${patient.bedNumber}`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`hidden lg:table-cell ${getCellBackgroundColor(patient)}`}>
                        {patient.procedure ? (
                          <div className="max-w-xs">
                            <p className="truncate font-medium text-sm" title={patient.procedure}>
                              {patient.procedure}
                            </p>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getProcedureStatusColor(patient.procedureStatus)}`}>
                              <ProcedureIcon className="h-3 w-3" />
                              {patient.procedureStatus || 'pending'}
                            </div>
                            {patient.procedureDate && patient.procedureStatus === 'completed' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completed: {formatDate(patient.procedureDate)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No procedure</span>
                        )}
                      </TableCell>
                      <TableCell className={`hidden xl:table-cell ${getCellBackgroundColor(patient)}`}>
                        {patient.doctorName ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">Dr. {patient.doctorName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className={`hidden xl:table-cell ${getCellBackgroundColor(patient)}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(patient.admissionDate)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No cases found matching your criteria.</p>
              <p className="text-sm text-gray-400 mt-2">
                Cases will appear here when doctors mark patients as done and assign them to you.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}