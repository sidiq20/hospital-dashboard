import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
              Advanced Healthcare
              <br />
              Management System
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Streamline patient care, manage procedures, and enhance medical workflows 
              with our comprehensive hospital management platform.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Real-time patient monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Comprehensive procedure tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-gray-700">Advanced analytics and reporting</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-gray-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-32 w-20 h-20 border border-gray-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 right-10 w-4 h-4 bg-gray-300 rounded-full opacity-40"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 bg-black">
        <div className="w-full max-w-md">
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
            <CardHeader className="text-center pb-8 bg-gray-900">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-900">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@lasuth.com"
                    required
                    className="h-12 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 bg-black border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
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

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-white text-black hover:bg-gray-100 font-semibold transition-all duration-200 group" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 text-center">
                <p className="text-gray-400 mb-6">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-white hover:text-gray-300 transition-colors underline underline-offset-4">
                    Create one here
                  </Link>
                </p>
                
                <div className="border-t border-gray-800 pt-6">
                  <p className="text-sm text-gray-500 mb-3">
                    Demo accounts for testing:
                  </p>
                  <div className="text-xs text-gray-600 space-y-2 bg-black p-4 rounded-lg border border-gray-800">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Doctor:</span>
                      <span className="text-gray-300">doctor@hospital.com / doctor123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Consultant:</span>
                      <span className="text-gray-300">consultant@hospital.com / consultant123</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}