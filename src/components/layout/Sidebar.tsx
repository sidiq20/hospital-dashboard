import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  UserPlus, 
  Building2, 
  UserCheck,
  BarChart3,
  Home,
  LogOut,
  UsersIcon,
  Plus,
  FileText,
  CheckCircle
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
    name: 'Wards', 
    href: '/wards', 
    icon: Building2, 
    roles: ['doctor']
  },
  { 
    name: 'Add Ward', 
    href: '/wards/new', 
    icon: Plus, 
    roles: ['doctor']
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
  }
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { userProfile, logout } = useAuth();

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
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MediCare</h1>
            <p className="text-xs text-gray-500">Hospital Management</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {userProfile?.role || 'User'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}