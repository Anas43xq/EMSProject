import { supabase } from './supabase';
import type { EmployeeBasic, EmployeeWithNumber } from './types';

/**
 * Fetch active employees with basic fields (id, first_name, last_name).
 * Used by Departments for head selection.
 */
export async function fetchActiveEmployees(): Promise<EmployeeBasic[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('status', 'active')
    .order('first_name');

  if (error) {
    console.error('Error loading employees:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch active employees with employee_number.
 * Used by Attendance and UserManagement for dropdowns.
 */
export async function fetchActiveEmployeesWithNumber(): Promise<EmployeeWithNumber[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employee_number')
    .eq('status', 'active')
    .order('first_name');

  if (error) {
    console.error('Error loading employees:', error);
    return [];
  }
  return data || [];
}
