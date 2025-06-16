import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Stethoscope, 
  Heart, 
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { User } from '@/types';
import { getUsers } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function Staff() {
  const [staff, setStaff] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'reception' as 'admin' | 'doctor' | 'nurse' | 'reception',
    phone: '',
    department: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffData = await getUsers();
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
        toast.error('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  useEffect(() => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, roleFilter]);

  const handleEditStaff = (staffMember: User) => {
    setEditingStaff(staffMember);
    setEditFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      role: staffMember.role,
      phone: staffMember.phone || '',
      department: staffMember.department || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    setUpdating(true);
    try {
      const docRef = doc(db, 'users', editingStaff.id);
      await updateDoc(docRef, {
        name: editFormData.name,
        role: editFormData.role,
        phone: editFormData.phone || undefined,
        department: editFormData.department || undefined
      });

      // Update local state
      setStaff(prev => prev.map(member => 
        member.id === editingStaff.id 
          ? { ...member, ...editFormData, phone: editFormData.phone || undefined, department: editFormData.department || undefined }
          : member
      ));

      setEditDialogOpen(false);
      setEditingStaff(null);
      toast.success('Staff member updated successfully');
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setStaff(prev => prev.filter(member => member.id !== id));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'doctor': return Stethoscope;
      case 'nurse': return Heart;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'doctor': return 'default';
      case 'nurse': return 'secondary';
      case 'reception': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleStats = () => {
    const stats = {
      admin: staff.filter(s => s.role === 'admin').length,
      doctor: staff.filter(s => s.role === 'doctor').length,
      nurse: staff.filter(s => s.role === 'nurse').length,
      reception: staff.filter(s => s.role === 'reception').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const roleStats = getRoleStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage hospital staff members and their roles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Administrators</p>
                <p className="text-2xl font-bold text-red-900">{roleStats.admin}</p>
              </div>
              <div className="h-12 w-12 bg-red-200 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Doctors</p>
                <p className="text-2xl font-bold text-blue-900">{roleStats.doctor}</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Nurses</p>
                <p className="text-2xl font-bold text-green-900">{roleStats.nurse}</p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Reception</p>
                <p className="text-2xl font-bold text-purple-900">{roleStats.reception}</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="reception">Reception</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Joined</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const RoleIcon = getRoleIcon(member.role);
                  const memberName = member.name || 'Unknown';
                  const memberEmail = member.email || 'No email';
                  
                  return (
                    <TableRow key={member.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-700">
                              {memberName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{memberName}</p>
                            <p className="text-sm text-gray-600">{memberEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={getRoleColor(member.role)} className="flex items-center gap-1 w-fit">
                          <RoleIcon className="h-3 w-3" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{member.department}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{memberEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Staff"
                            onClick={() => handleEditStaff(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Staff">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {memberName}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStaff(member.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No staff members found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <select
                id="editRole"
                value={editFormData.role}
                onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reception">Reception</option>
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Input
                id="editDepartment"
                value={editFormData.department}
                onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUpdateStaff} 
                disabled={updating || !editFormData.name.trim()}
                className="flex-1"
              >
                {updating ? 'Updating...' : 'Update Staff Member'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}