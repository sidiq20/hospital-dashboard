"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Users, 
  UserPlus, 
  UserCheck,
  BarChart3,
  Home,
  LogOut,
  UsersIcon,
  FileText,
  CheckCircle,
  Calendar,
  CalendarCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['doctor', 'consultant']
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['doctor', 'consultant']
  },
  {
    name: 'Add Patient',
    href: '/patients/new',
    icon: UserPlus,
    roles: ['doctor']
  },
  {
    name: 'My Patients',
    href: '/my-patients',
    icon: FileText,
    roles: ['doctor']
  },
  {
    name: 'My Cases',
    href: '/my-cases',
    icon: CheckCircle,
    roles: ['consultant']
  },
  {
    name: 'Upcoming Appointments',
    href: '/appointments/upcoming',
    icon: Calendar,
    roles: ['doctor', 'consultant']
  },
  {
    name: 'My Appointments',
    href: '/appointments/my',
    icon: CalendarCheck,
    roles: ['doctor', 'consultant']
  },
  {
    name: 'Consultants',
    href: '/consultants',
    icon: UserCheck,
    roles: ['doctor']
  },
  {
    name: 'Staff',
    href: '/staff',
    icon: UsersIcon,
    roles: ['doctor']
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['doctor', 'consultant']
  },
  {
    name: 'Wards',
    href: '/wards',
    icon: Building2,
    roles: ['doctor']
  }
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { userProfile, logout } = useAuth();
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item =>
    userProfile && item.roles.includes(userProfile.role)
  );

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-black border-r border-gray-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <Activity className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">LASUTH IR</h1>
            <p className="text-xs text-white-400">Interventional Radiology</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary shadow-sm border border-primary/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userProfile?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-400 capitalize truncate">
              {userProfile?.role || 'User'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}