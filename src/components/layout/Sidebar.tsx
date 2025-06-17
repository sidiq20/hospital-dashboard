import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  UserPlus, 
  Building2, 
  Shield, 
  BarChart3,
  Home,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'doctor', 'nurse', 'reception'] },
  { name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'reception'] },
  { name: 'Add Patient', href: '/patients/new', icon: UserPlus, roles: ['admin', 'doctor', 'reception'] },
  { name: 'Wards', href: '/wards', icon: Building2, roles: ['admin', 'doctor', 'nurse'] },
  { name: 'Staff', href: '/staff', icon: Shield, roles: ['admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'doctor'] },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { userProfile, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    userProfile && item.roles.includes(userProfile.role)
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200 shadow-lg fixed top-0 left-0 z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">LASUTH</h1>
            <p className="text-xs text-gray-500">Hospital Management</p>
          </div>
        </div>
      </div>

      {/* Navigation - scrollable section */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
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

      {/* Logout - pinned to bottom */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {userProfile?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {userProfile?.role}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
