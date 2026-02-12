import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'employee'] },
    { name: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Departments', href: '/departments', icon: Building2, roles: ['admin', 'hr'] },
    { name: 'Leave Management', href: '/leaves', icon: Calendar, roles: ['admin', 'hr', 'employee'] },
    { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'hr', 'employee'] },
    { name: 'Performance', href: '/performance', icon: TrendingUp, roles: ['admin', 'hr', 'employee'] },
    { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
    { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'hr'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'hr', 'employee'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || 'employee')
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">EMS</h1>
                <p className="text-blue-300 text-xs">University Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-blue-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center space-x-3 px-4 py-2 mb-2 text-blue-100">
              <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user?.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:ml-64 transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:block hidden" />

            <div className="flex items-center space-x-4">
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
