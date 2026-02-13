export interface Department {
  id: string;
  name: string;
}

export interface Employee {
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

export interface Leave {
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

export interface Attendance {
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

export interface DepartmentReport {
  id: string;
  name: string;
  type: string;
  description: string | null;
  employees: { count: number }[];
}

export type ReportType = 'employee' | 'leave' | 'attendance' | 'department';
