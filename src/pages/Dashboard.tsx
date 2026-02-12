import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Building2, Calendar, TrendingUp, Clock, CheckCircle, DollarSign, UserCheck, XCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Stats {
  totalEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  activeEmployees: number;
  todayAttendance: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingPayroll: number;
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
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingPayroll: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [leaveStatusData, setLeaveStatusData] = useState<LeaveStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [
        employeesRes,
        departmentsRes,
        pendingLeavesRes,
        approvedLeavesRes,
        rejectedLeavesRes,
        activitiesRes,
        attendanceRes,
        payrollRes,
        departmentEmployeesRes
      ] = await Promise.all([
        supabase.from('employees').select('id, status', { count: 'exact' }),
        supabase.from('departments').select('id', { count: 'exact' }),
        supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'rejected'),
        supabase.from('activity_logs').select('id, action, created_at, entity_type').order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present'),
        supabase.from('payroll').select('id', { count: 'exact' }).eq('status', 'pending').eq('month', currentMonth).eq('year', currentYear),
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
        pendingPayroll: payrollRes.count || 0,
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

  const statCards = [
    { name: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Employees', value: stats.activeEmployees, icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'bg-teal-500' },
    { name: 'Pending Leaves', value: stats.pendingLeaves, icon: Calendar, color: 'bg-orange-500' },
    { name: "Today's Attendance", value: stats.todayAttendance, icon: UserCheck, color: 'bg-cyan-500' },
    { name: 'Approved Leaves', value: stats.approvedLeaves, icon: CheckCircle, color: 'bg-emerald-500' },
    { name: 'Rejected Leaves', value: stats.rejectedLeaves, icon: XCircle, color: 'bg-red-500' },
    { name: 'Pending Payroll', value: stats.pendingPayroll, icon: DollarSign, color: 'bg-yellow-500' },
  ];

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
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/employees?action=add')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <Users className="w-6 h-6 text-blue-900 mb-2" />
                <ArrowRight className="w-4 h-4 text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-gray-900">Add Employee</p>
            </button>
            <button 
              onClick={() => navigate('/leaves?action=apply')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <Calendar className="w-6 h-6 text-green-900 mb-2" />
                <ArrowRight className="w-4 h-4 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-gray-900">Apply Leave</p>
            </button>
            <button 
              onClick={() => navigate('/attendance')}
              className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg text-left transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <Clock className="w-6 h-6 text-teal-900 mb-2" />
                <ArrowRight className="w-4 h-4 text-teal-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <TrendingUp className="w-6 h-6 text-orange-900 mb-2" />
                <ArrowRight className="w-4 h-4 text-orange-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
