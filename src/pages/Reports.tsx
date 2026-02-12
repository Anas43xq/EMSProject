import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { FileText, Download, Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  employment_type: string;
  status: string;
  hire_date: string;
  departments: { name: string } | null;
}

interface Leave {
  id: string;
  employees: {
    first_name: string;
    last_name: string;
    departments: { name: string } | null;
  };
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
}

interface Attendance {
  id: string;
  employees: {
    first_name: string;
    last_name: string;
    departments: { name: string } | null;
  };
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  hours_worked: number | null;
}

interface PerformanceReview {
  id: string;
  employees: {
    first_name: string;
    last_name: string;
    departments: { name: string } | null;
  };
  review_period: string;
  rating: number;
  goals: string | null;
  achievements: string | null;
  areas_for_improvement: string | null;
  reviewer_notes: string | null;
}

interface Payroll {
  id: string;
  employees: {
    first_name: string;
    last_name: string;
    departments: { name: string } | null;
  };
  pay_period: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string | null;
  payment_status: string;
}

interface DepartmentReport {
  id: string;
  name: string;
  type: string;
  description: string | null;
  employees: { count: number }[];
}

type ReportType = 'employee' | 'leave' | 'attendance' | 'performance' | 'payroll' | 'department';

export default function Reports() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('employee');
  const [dateRange, setDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const getDateFilter = () => {
    const today = new Date();
    const days = parseInt(dateRange);
    if (isNaN(days)) return null;

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    return startDate.toISOString();
  };

  const generateEmployeeReport = async () => {
    let query = supabase
      .from('employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        position,
        employment_type,
        status,
        hire_date,
        departments!department_id (name)
      `)
      .order('last_name');

    if (selectedDepartment) {
      query = query.eq('department_id', selectedDepartment);
    }

    const { data, error } = await query as { data: Employee[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(emp => ({
      'Employee ID': emp.id,
      'First Name': emp.first_name,
      'Last Name': emp.last_name,
      'Email': emp.email,
      'Phone': emp.phone,
      'Position': emp.position,
      'Department': emp.departments?.name || 'N/A',
      'Employment Type': emp.employment_type,
      'Status': emp.status,
      'Hire Date': format(new Date(emp.hire_date), 'yyyy-MM-dd'),
    }));
  };

  const generateLeaveReport = async () => {
    let query = supabase
      .from('leaves')
      .select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        leave_type,
        start_date,
        end_date,
        days,
        status,
        reason
      `)
      .order('start_date', { ascending: false });

    const dateFilter = getDateFilter();
    if (dateFilter) {
      query = query.gte('start_date', dateFilter);
    }

    if (selectedDepartment) {
      query = query.eq('employees.department_id', selectedDepartment);
    }

    const { data, error } = await query as { data: Leave[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(leave => ({
      'Leave ID': leave.id,
      'Employee': `${leave.employees.first_name} ${leave.employees.last_name}`,
      'Department': leave.employees.departments?.name || 'N/A',
      'Leave Type': leave.leave_type,
      'Start Date': format(new Date(leave.start_date), 'yyyy-MM-dd'),
      'End Date': format(new Date(leave.end_date), 'yyyy-MM-dd'),
      'Days': leave.days,
      'Status': leave.status,
      'Reason': leave.reason || 'N/A',
    }));
  };

  const generateAttendanceReport = async () => {
    let query = supabase
      .from('attendance')
      .select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        date,
        check_in,
        check_out,
        status,
        hours_worked
      `)
      .order('date', { ascending: false });

    const dateFilter = getDateFilter();
    if (dateFilter) {
      query = query.gte('date', dateFilter);
    }

    if (selectedDepartment) {
      query = query.eq('employees.department_id', selectedDepartment);
    }

    const { data, error } = await query as { data: Attendance[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(att => ({
      'Attendance ID': att.id,
      'Employee': `${att.employees.first_name} ${att.employees.last_name}`,
      'Department': att.employees.departments?.name || 'N/A',
      'Date': format(new Date(att.date), 'yyyy-MM-dd'),
      'Check In': att.check_in || 'N/A',
      'Check Out': att.check_out || 'N/A',
      'Status': att.status,
      'Hours Worked': att.hours_worked || 0,
    }));
  };

  const generatePerformanceReport = async () => {
    let query = supabase
      .from('performance_reviews')
      .select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        review_period,
        rating,
        goals,
        achievements,
        areas_for_improvement,
        reviewer_notes
      `)
      .order('review_period', { ascending: false });

    const dateFilter = getDateFilter();
    if (dateFilter) {
      query = query.gte('review_period', dateFilter);
    }

    if (selectedDepartment) {
      query = query.eq('employees.department_id', selectedDepartment);
    }

    const { data, error } = await query as { data: PerformanceReview[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(perf => ({
      'Review ID': perf.id,
      'Employee': `${perf.employees.first_name} ${perf.employees.last_name}`,
      'Department': perf.employees.departments?.name || 'N/A',
      'Review Period': format(new Date(perf.review_period), 'yyyy-MM-dd'),
      'Rating': perf.rating,
      'Goals': perf.goals || 'N/A',
      'Achievements': perf.achievements || 'N/A',
      'Areas for Improvement': perf.areas_for_improvement || 'N/A',
      'Reviewer Notes': perf.reviewer_notes || 'N/A',
    }));
  };

  const generatePayrollReport = async () => {
    let query = supabase
      .from('payroll')
      .select(`
        id,
        employees!employee_id (
          first_name,
          last_name,
          departments!department_id (name)
        ),
        pay_period,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        payment_date,
        payment_status
      `)
      .order('pay_period', { ascending: false });

    const dateFilter = getDateFilter();
    if (dateFilter) {
      query = query.gte('pay_period', dateFilter);
    }

    if (selectedDepartment) {
      query = query.eq('employees.department_id', selectedDepartment);
    }

    const { data, error } = await query as { data: Payroll[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(pay => ({
      'Payroll ID': pay.id,
      'Employee': `${pay.employees.first_name} ${pay.employees.last_name}`,
      'Department': pay.employees.departments?.name || 'N/A',
      'Pay Period': format(new Date(pay.pay_period), 'yyyy-MM-dd'),
      'Basic Salary': pay.basic_salary,
      'Allowances': pay.allowances,
      'Deductions': pay.deductions,
      'Net Salary': pay.net_salary,
      'Payment Date': pay.payment_date ? format(new Date(pay.payment_date), 'yyyy-MM-dd') : 'Pending',
      'Payment Status': pay.payment_status,
    }));
  };

  const generateDepartmentReport = async () => {
    let query = supabase
      .from('departments')
      .select(`
        id,
        name,
        type,
        description,
        employees!department_id (count)
      `)
      .order('name');

    if (selectedDepartment) {
      query = query.eq('id', selectedDepartment);
    }

    const { data, error } = await query as { data: DepartmentReport[] | null; error: any };
    if (error) throw error;
    if (!data) return [];

    return data.map(dept => ({
      'Department ID': dept.id,
      'Department Name': dept.name,
      'Type': dept.type,
      'Description': dept.description || 'N/A',
      'Total Employees': dept.employees?.[0]?.count || 0,
    }));
  };

  const generateReport = async (type: ReportType) => {
    setLoading(true);
    try {
      let reportData;
      let filename;

      switch (type) {
        case 'employee':
          reportData = await generateEmployeeReport();
          filename = 'employee-directory-report';
          break;
        case 'leave':
          reportData = await generateLeaveReport();
          filename = 'leave-report';
          break;
        case 'attendance':
          reportData = await generateAttendanceReport();
          filename = 'attendance-report';
          break;
        case 'performance':
          reportData = await generatePerformanceReport();
          filename = 'performance-report';
          break;
        case 'payroll':
          reportData = await generatePayrollReport();
          filename = 'payroll-report';
          break;
        case 'department':
          reportData = await generateDepartmentReport();
          filename = 'department-report';
          break;
      }

      if (reportData && reportData.length > 0) {
        downloadCSV(reportData, filename);
        showNotification('success', `Report generated successfully! ${reportData.length} records exported.`);
      } else {
        showNotification('warning', 'No data found for the selected criteria.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification('error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCustomReport = () => {
    generateReport(selectedReport);
  };

  const reports = [
    {
      id: 'employee' as ReportType,
      name: 'Employee Directory Report',
      description: 'Complete list of all employees with their details',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 'leave' as ReportType,
      name: 'Leave Report',
      description: 'Summary of leave applications and balances',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      id: 'attendance' as ReportType,
      name: 'Attendance Report',
      description: 'Monthly attendance records and statistics',
      icon: Clock,
      color: 'bg-cyan-500',
    },
    {
      id: 'performance' as ReportType,
      name: 'Performance Report',
      description: 'Performance reviews and ratings summary',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      id: 'payroll' as ReportType,
      name: 'Payroll Report',
      description: 'Salary disbursement and payroll summary',
      icon: FileText,
      color: 'bg-red-500',
    },
    {
      id: 'department' as ReportType,
      name: 'Department Report',
      description: 'Department-wise employee distribution',
      icon: Users,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate and download various reports in CSV format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className={`${report.color} p-3 rounded-lg`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <button
                  onClick={() => generateReport(report.id)}
                  disabled={loading}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Generate Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">Employee Report</option>
              <option value="leave">Leave Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="performance">Performance Report</option>
              <option value="payroll">Payroll Report</option>
              <option value="department">Department Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="365">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            >
              <option>CSV</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">CSV format is currently supported</p>
          </div>
        </div>
        <button
          onClick={generateCustomReport}
          disabled={loading}
          className="mt-6 flex items-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Generate Custom Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
