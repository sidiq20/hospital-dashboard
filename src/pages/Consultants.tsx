import { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  Building2,
  Award,
  Calendar
} from 'lucide-react';
import { User } from '@/types';
import { getUsers, createUser } from '@/services/database';
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

export function Consultants() {
  const [consultants, setConsultants] = useState<User[]>([]);
  const [filteredConsultants, setFilteredConsultants] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    specialization: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const users = await getUsers();
        const consultantUsers = users.filter(user => user.role === 'consultant');
        setConsultants(consultantUsers);
      } catch (error) {
        console.error('Error loading consultants:', error);
        toast.error('Failed to load consultants data');
      } finally {
        setLoading(false);
      }
    };

    loadConsultants();
  }, []);

  useEffect(() => {
    let filtered = consultants;

    if (searchTerm) {
      filtered = filtered.filter(consultant =>
        (consultant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (consultant.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (consultant.department && consultant.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (consultant.specialization && consultant.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredConsultants(filtered);
  }, [consultants, searchTerm]);

  const handleEditConsultant = (consultant: User) => {
    setEditingConsultant(consultant);
    const nameParts = (consultant.name || '').split(' ');
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: consultant.email || '',
      phone: consultant.phone || '',
      department: consultant.department || '',
      specialization: consultant.specialization || ''
    });
    setEditDialogOpen(true);
  };

  const handleAddConsultant = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      specialization: ''
    });
    setAddDialogOpen(true);
  };

  const handleUpdateConsultant = async () => {
    if (!editingConsultant) return;

    setUpdating(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const docRef = doc(db, 'users', editingConsultant.id);
      await updateDoc(docRef, {
        name: fullName,
        phone: formData.phone,
        department: formData.department,
        specialization: formData.specialization
      });

      // Update local state
      setConsultants(prev => prev.map(consultant => 
        consultant.id === editingConsultant.id 
          ? { ...consultant, name: fullName, phone: formData.phone, department: formData.department, specialization: formData.specialization }
          : consultant
      ));

      setEditDialogOpen(false);
      setEditingConsultant(null);
      toast.success('Consultant updated successfully');
    } catch (error) {
      console.error('Error updating consultant:', error);
      toast.error('Failed to update consultant');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateConsultant = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    setUpdating(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const consultantData = {
        name: fullName,
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@hospital.com`,
        role: 'consultant' as const,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
        specialization: formData.specialization || undefined
      };

      const docId = await createUser(consultantData);
      
      // Update local state
      setConsultants(prev => [...prev, { id: docId, ...consultantData, createdAt: new Date() }]);

      setAddDialogOpen(false);
      toast.success('Consultant added successfully');
    } catch (error) {
      console.error('Error creating consultant:', error);
      toast.error('Failed to create consultant');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConsultant = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setConsultants(prev => prev.filter(consultant => consultant.id !== id));
      toast.success('Consultant deleted successfully');
    } catch (error) {
      toast.error('Failed to delete consultant');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Consultants</h1>
          <p className="text-gray-600">Manage hospital consultants and their specializations</p>
        </div>
        <Button onClick={handleAddConsultant} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Consultant
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consultants</p>
              <p className="text-2xl font-bold text-gray-900">{consultants.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Consultants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, department, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Consultants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Specialization</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Joined</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultants.map((consultant) => {
                  const consultantName = consultant.name || 'Unknown';
                  const consultantEmail = consultant.email || 'No email';
                  
                  return (
                    <TableRow key={consultant.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-green-700">
                              {consultantName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{consultantName}</p>
                            <p className="text-sm text-gray-600">{consultantEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {consultant.specialization ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Award className="h-3 w-3" />
                            {consultant.specialization}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {consultant.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{consultant.department}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {consultant.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{consultant.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{consultantEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Consultant"
                            onClick={() => handleEditConsultant(consultant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Consultant">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Consultant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {consultantName}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteConsultant(consultant.id)}>
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
          {filteredConsultants.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No consultants found matching your criteria.</p>
              <Button onClick={handleAddConsultant} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Consultant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Consultant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consultant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Input
                id="editDepartment"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
              />
            </div>
            <div>
              <Label htmlFor="editSpecialization">Specialization</Label>
              <Input
                id="editSpecialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="Enter specialization"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUpdateConsultant} 
                disabled={updating || !formData.firstName.trim() || !formData.lastName.trim()}
                className="flex-1"
              >
                {updating ? 'Updating...' : 'Update Consultant'}
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

      {/* Add Consultant Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Consultant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addFirstName">First Name *</Label>
                <Input
                  id="addFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="addLastName">Last Name *</Label>
                <Input
                  id="addLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addEmail">Email (Optional)</Label>
              <Input
                id="addEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address (auto-generated if empty)"
              />
            </div>
            <div>
              <Label htmlFor="addPhone">Phone</Label>
              <Input
                id="addPhone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="addDepartment">Department</Label>
              <Input
                id="addDepartment"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
              />
            </div>
            <div>
              <Label htmlFor="addSpecialization">Specialization</Label>
              <Input
                id="addSpecialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="Enter specialization"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateConsultant} 
                disabled={updating || !formData.firstName.trim() || !formData.lastName.trim()}
                className="flex-1"
              >
                {updating ? 'Adding...' : 'Add Consultant'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAddDialogOpen(false)}
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