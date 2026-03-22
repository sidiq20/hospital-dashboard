"use client";

import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
} from 'lucide-react';
import { User } from '@/types';
import { getUsers, createUser } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    specialization: '',
    role: 'doctor' as 'doctor' | 'consultant'
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const users = await getUsers();
        setStaff(users);
      } catch (error) {
        toast.error('Failed to load staff');
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  useEffect(() => {
    let filtered = staff;
    if (searchTerm) {
      filtered = filtered.filter(m => 
        (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === roleFilter);
    }
    setFilteredStaff(filtered);
  }, [staff, searchTerm, roleFilter]);

  const handleCreate = async () => {
    setUpdating(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const staffData = {
        name: fullName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        department: formData.department,
        specialization: formData.specialization
      };
      const id = await createUser(staffData as any);
      const newMember = { id, ...staffData, createdAt: new Date() } as User;
      setStaff(prev => [...prev, newMember]);
      setAddDialogOpen(false);
      toast.success('Added successfully');
    } catch (error) {
      toast.error('Failed to add');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setStaff(prev => prev.filter(m => m.id !== id));
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="p-8"><div className="animate-pulse h-8 bg-gray-800 rounded w-1/4 mb-6"></div></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Staff Management</h1>
          <p className="text-gray-400">Manage all hospital staff</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardContent className="pt-6 flex items-center justify-between">
            <div><p className="text-sm text-gray-400">Total Staff</p><p className="text-2xl font-bold">{staff.length}</p></div>
            <Users className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white">Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-800 border-gray-700 text-white" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2">
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="consultant">Consultants</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 border-gray-700">
                  <TableHead className="text-gray-200">Name</TableHead>
                  <TableHead className="text-gray-200">Role</TableHead>
                  <TableHead className="text-gray-200 hidden md:table-cell">Department</TableHead>
                  <TableHead className="text-right text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((m) => (
                  <TableRow key={m.id} className="border-gray-800 hover:bg-gray-800">
                    <TableCell className="text-white font-medium">{m.name}</TableCell>
                    <TableCell><Badge className={m.role === 'doctor' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}>{m.role}</Badge></TableCell>
                    <TableCell className="text-gray-400 hidden md:table-cell">{m.department || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="h-3 w-3 text-red-500" /></Button></AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
                            <AlertDialogHeader><AlertDialogTitle>Delete Staff?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 border-gray-700">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600" onClick={() => handleDelete(m.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-gray-800 border-gray-700" />
              <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-gray-800 border-gray-700" />
            </div>
            <Input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-gray-800 border-gray-700" />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full bg-gray-800 border-gray-700 rounded-md p-2">
              <option value="doctor">Doctor</option>
              <option value="consultant">Consultant</option>
            </select>
            <Input placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="bg-gray-800 border-gray-700" />
            <Button onClick={handleCreate} disabled={updating} className="w-full bg-blue-600 hover:bg-blue-700">Add Staff</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
