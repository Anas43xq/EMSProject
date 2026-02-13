export interface User {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  employee_id: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  last_sign_in_at?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
    position: string;
    department_id: string;
    departments?: {
      name: string;
    };
  };
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  email: string;
  position: string;
  department_id: string;
  departments?: {
    name: string;
  };
}

export interface UserFormData {
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'employee';
  employee_id: string | null;
}
