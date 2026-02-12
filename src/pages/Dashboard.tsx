import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Building2, Calendar, TrendingUp, Clock, CheckCircle, UserCheck, XCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getVisibleQuickActions, isWidgetVisible, UserRole } from '../lib/dashboardConfig';

interface Stats {
  totalEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  activeEmployees: number;
  todayAttendance: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}

interface RecentActivity {
  id: string;
  action: string;
  created_at: string;
  entity_type: string;
}

interface DepartmentData {
  name: string;
  count: number;
}

interface LeaveStatusData {
  name: string;
  value: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [leaveStatusData, setLeaveStatusData] = useState<LeaveStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      loadDashboardData(user.role, user.employeeId);
    }
  }, [user?.role, user?.employeeId]);

  const loadDashboardData = async (role: UserRole, employeeId: string | null) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Build queries based on role
      let pendingLeavesQuery = supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'pending');
      let approvedLeavesQuery = supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'approved');
      let rejectedLeavesQuery = supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'rejected');
      let attendanceQuery = supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present');

      // For employees, filter to their own data
      if (role === 'employee' && employeeId) {
        pendingLeavesQuery = pendingLeavesQuery.eq('employee_id', employeeId);
        approvedLeavesQuery = approvedLeavesQuery.eq('employee_id', employeeId);
        rejectedLeavesQuery = rejectedLeavesQuery.eq('employee_id', employeeId);
        attendanceQuery = attendanceQuery.eq('employee_id', employeeId);
      }

      const [
        employeesRes,
        departmentsRes,
        pendingLeavesRes,
        approvedLeavesRes,
        rejectedLeavesRes,
        activitiesRes,
        attendanceRes,
        departmentEmployeesRes
      ] = await Promise.all([
        supabase.from('employees').select('id, status', { count: 'exact' }),
        supabase.from('departments').select('id', { count: 'exact' }),
        pendingLeavesQuery,
        approvedLeavesQuery,
        rejectedLeavesQuery,
        supabase.from('activity_logs').select('id, action, created_at, entity_type').order('created_at', { ascending: false }).limit(5),
        attendanceQuery,
        supabase.from('employees').select('department_id, departments(name)')
      ]);

      const activeEmployees = employeesRes.data?.filter((e: any) => e.status === 'active').length || 0;

      setStats({
        totalEmployees: employeesRes.count || 0,
        totalDepartments: departmentsRes.count || 0,
        pendingLeaves: pendingLeavesRes.count || 0,
        activeEmployees,
        todayAttendance: attendanceRes.count || 0,
        approvedLeaves: approvedLeavesRes.count || 0,
        rejectedLeaves: rejectedLeavesRes.count || 0,
      });

      setRecentActivities(activitiesRes.data || []);

      const deptCounts: { [key: string]: number } = {};
      departmentEmployeesRes.data?.forEach((emp: any) => {
        const deptName = emp.departments?.name || 'Unassigned';
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });

      const deptData = Object.entries(deptCounts).map(([name, count]) => ({
        name,
        count,
      }));
      setDepartmentData(deptData);

      const leaveStatusCounts = {
        Pending: pendingLeavesRes.count || 0,
        Approved: approvedLeavesRes.count || 0,
        Rejected: rejectedLeavesRes.count || 0,
      };

      const leaveData = Object.entries(leaveStatusCounts)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
        }));
      setLeaveStatusData(leaveData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allStatCards = [
    { id: 'totalEmployees', name: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
    { id: 'activeEmployees', name: 'Active Employees', value: stats.activeEmployees, icon: CheckCircle, color: 'bg-green-500' },
    { id: 'departments', name: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'bg-teal-500' },
    { id: 'pendingLeaves', name: 'Pending Leaves', value: stats.pendingLeaves, icon: Calendar, color: 'bg-orange-500' },
    { id: 'todayAttendance', name: "Today's Attendance", value: stats.todayAttendance, icon: UserCheck, color: 'bg-cyan-500' },
    { id: 'approvedLeaves', name: 'Approved Leaves', value: stats.approvedLeaves, icon: CheckCircle, color: 'bg-emerald-500' },
    { id: 'rejectedLeaves', name: 'Rejected Leaves', value: stats.rejectedLeaves, icon: XCircle, color: 'bg-red-500' },
  ];

  const statCards = allStatCards.filter(card => isWidgetVisible(card.id, user?.role || 'employee'));

  const LEAVE_COLORS = {
    Pending: '#f59e0b',
    Approved: '#10b981',
    Rejected: '#ef4444',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Employee Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat: any) => (
          <div key={stat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(isWidgetVisible('departmentChart', user?.role || 'employee') || isWidgetVisible('leaveChart', user?.role || 'employee')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isWidgetVisible('departmentChart', user?.role || 'employee') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Employees by Department</h2>
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No department data available</p>
                </div>
              )}
            </div>
          )}

          {isWidgetVisible('leaveChart', user?.role || 'employee') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Status Distribution</h2>
              {leaveStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leaveStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LEAVE_COLORS[entry.name as keyof typeof LEAVE_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No leave data available</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isWidgetVisible('recentActivities', user?.role || 'employee') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activities</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className={`grid gap-4 ${getVisibleQuickActions(user?.role || 'employee').length <= 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {getVisibleQuickActions(user?.role || 'employee').map((action) => {
              const iconMap: { [key: string]: any } = {
                Users,
                Calendar,
                Clock,
                TrendingUp,
              };
              const Icon = iconMap[action.icon];
              const colorMap: { [key: string]: string } = {
                blue: 'bg-blue-50 hover:bg-blue-100 text-blue-900',
                green: 'bg-green-50 hover:bg-green-100 text-green-900',
                teal: 'bg-teal-50 hover:bg-teal-100 text-teal-900',
                orange: 'bg-orange-50 hover:bg-orange-100 text-orange-900',
              };
              
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.to)}
                  className={`p-4 ${colorMap[action.color]} rounded-lg text-left transition-all duration-200 group`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="w-6 h-6 mb-2" />
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
