import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { Download, Users, Calendar, Clock } from 'lucide-react';
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

interface DepartmentReport {
  id: string;
  name: string;
  type: string;
  description: string | null;
  employees: { count: number }[];
}

type ReportType = 'employee' | 'leave' | 'attendance' | 'department';

export default function Reports() {
  const { t } = useTranslation();
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
        case 'department':
          reportData = await generateDepartmentReport();
          filename = 'department-report';
          break;
      }

      if (reportData && reportData.length > 0) {
        downloadCSV(reportData, filename);
        showNotification('success', t('reports.reportSuccess', { count: reportData.length }));
      } else {
        showNotification('warning', t('reports.noData'));
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification('error', t('reports.reportFailed'));
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
      name: t('reports.employeeReport'),
      description: t('reports.employeeReportDesc'),
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 'leave' as ReportType,
      name: t('reports.leaveReport'),
      description: t('reports.leaveReportDesc'),
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      id: 'attendance' as ReportType,
      name: t('reports.attendanceReport'),
      description: t('reports.attendanceReportDesc'),
      icon: Clock,
      color: 'bg-cyan-500',
    },
    {
      id: 'department' as ReportType,
      name: t('reports.departmentReport'),
      description: t('reports.departmentReportDesc'),
      icon: Users,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
        <p className="text-gray-600 mt-2">{t('reports.subtitle')}</p>
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
                      <span className="text-sm">{t('reports.generatingReport')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{t('reports.generateReport')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('reports.customReport')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.reportType')}</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">{t('reports.employeeReportOption')}</option>
              <option value="leave">{t('reports.leaveReportOption')}</option>
              <option value="attendance">{t('reports.attendanceReportOption')}</option>
              <option value="department">{t('reports.departmentReportOption')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.dateRange')}</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">{t('reports.last7Days')}</option>
              <option value="30">{t('reports.last30Days')}</option>
              <option value="90">{t('reports.last3Months')}</option>
              <option value="365">{t('reports.lastYear')}</option>
              <option value="all">{t('reports.allTime')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.department')}</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('reports.allDepartments')}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
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
              <span>{t('reports.generatingReport')}</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>{t('reports.generateCustomReport')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
