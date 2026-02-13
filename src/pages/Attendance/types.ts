export interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}
