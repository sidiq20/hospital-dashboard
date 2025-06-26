import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'doctor' as 'doctor' | 'consultant',
    department: '',
    specialization: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        department: formData.department || undefined,
        specialization: formData.specialization || undefined
      });
      navigate('/');
      toast.success('Account created successfully! Welcome to LASUTH IR.');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
        <div className="relative z-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 bg-black rounded-xl flex items-center justify-center">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">LASUTH IR</h1>
                <p className="text-sm text-gray-600">Interventional Radiology</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-black mb-4 leading-tight">
              Join Our Medical
              <br />
              Excellence Team
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Create your account to access advanced healthcare management tools 
              and contribute to exceptional patient care.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Secure role-based access</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Collaborative care management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Professional medical workflows</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-gray-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-32 w-20 h-20 border border-gray-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 right-10 w-4 h-4 bg-gray-300 rounded-full opacity-40"></div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 bg-black">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LASUTH IR</h1>
              <p className="text-xs text-gray-400">Interventional Radiology</p>
            </div>
          </div>

          <Card className="bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader className="text-center pb-6 bg-gray-900">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Join the LASUTH IR team today
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-900">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-medium">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Dr. John Smith"
                      required
                      className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="doctor@lasuth.com"
                      required
                      className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 (xxx) xxx-xxxx"
                      className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white font-medium">Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-black text-white"
                    >
                      <option value="doctor">Doctor</option>
                      <option value="consultant">Consultant</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white font-medium">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Interventional Radiology"
                      className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-white font-medium">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      placeholder="e.g., Interventional Radiologist"
                      className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a strong password"
                        required
                        className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        required
                        className="h-11 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-white text-black hover:bg-gray-100 font-semibold transition-all duration-200 group mt-6" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-white hover:text-gray-300 transition-colors underline underline-offset-4">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}