import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { DollarSign, Download, Mail, X } from 'lucide-react';
import { generatePayslipPDF, type PayslipData } from '../lib/payslip';
import { notifyPayrollProcessed } from '../lib/notifications';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  employment_type: string;
  salary?: number;
  departments: {
    name: string;
  };
}

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: any;
  deductions: any;
  gross_salary: number;
  net_salary: number;
  payment_date: string | null;
  status: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
    position?: string;
    departments?: {
      name: string;
    };
  };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPayroll();
  }, [user, selectedYear]);

  const loadPayroll = async () => {
    try {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            employee_number,
            position,
            departments (
              name
            )
          )
        `)
        .eq('year', selectedYear)
        .order('month', { ascending: false });

      if (user?.role === 'employee' && user?.employeeId) {
        query = query.eq('employee_id', user.employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error loading payroll:', error);
      showNotification('error', 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    try {
      const payslipData: PayslipData = {
        employeeName: `${record.employees?.first_name} ${record.employees?.last_name}`,
        employeeId: record.employees?.employee_number || 'N/A',
        position: record.employees?.position || 'N/A',
        department: record.employees?.departments?.name || 'N/A',
        month: MONTHS[record.month - 1],
        year: record.year,
        basicSalary: record.basic_salary,
        allowances: record.allowances || {},
        deductions: record.deductions || {},
        grossSalary: record.gross_salary,
        netSalary: record.net_salary,
        status: record.status,
        paymentDate: record.payment_date ? new Date(record.payment_date).toLocaleDateString() : undefined,
      };

      generatePayslipPDF(payslipData);
      showNotification('success', 'Payslip downloaded successfully');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      showNotification('error', 'Failed to download payslip');
    }
  };


  const handleNotifyAllPayroll = async () => {
    if (payrollRecords.length === 0) {
      showNotification('warning', 'No payroll records to notify');
      return;
    }

    setNotifying(true);
    try {
      let successCount = 0;
      for (const record of payrollRecords) {
        try {
          // Note: In production, you'd fetch the actual employee email from the database
          await notifyPayrollProcessed(
            'employee@university.edu',
            MONTHS[record.month - 1],
            record.year,
            record.net_salary
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to notify for record ${record.id}:`, error);
        }
      }
      showNotification('success', `Payroll notifications sent to ${successCount} employees`);
    } finally {
      setNotifying(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          position,
          employment_type,
          departments (name)
        `)
        .eq('status', 'active')
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      showNotification('error', 'Failed to load employees');
    }
  };

  const handleGeneratePayroll = async () => {
    if (selectedEmployees.length === 0) {
      showNotification('warning', 'Please select at least one employee');
      return;
    }

    setGeneratingPayroll(true);
    try {
      let successCount = 0;
      let skipCount = 0;

      for (const employeeId of selectedEmployees) {
        try {
          // Check if payroll already exists
          const { data: existingPayroll } = await supabase
            .from('payroll')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('month', payrollMonth)
            .eq('year', payrollYear)
            .single();

          if (existingPayroll) {
            skipCount++;
            continue;
          }

          // Fetch employee details for salary calculation
          const { data: employee } = await supabase
            .from('employees')
            .select('id, salary')
            .eq('id', employeeId)
            .single() as any;

          if (!employee) continue;

          // Calculate salary components
          const basicSalary = employee.salary || 0;
          const allowances = {
            hra: basicSalary * 0.1, // 10% HRA
            da: basicSalary * 0.08, // 8% DA
          };
          const deductions = {
            pf: basicSalary * 0.12, // 12% Provident Fund
            tax: basicSalary * 0.05, // 5% Tax
          };

          const allowancesTotal = Object.values(allowances).reduce((a: number, b: number) => a + b, 0);
          const deductionsTotal = Object.values(deductions).reduce((a: number, b: number) => a + b, 0);
          const grossSalary = basicSalary + allowancesTotal;
          const netSalary = grossSalary - deductionsTotal;

          // Insert payroll record
          const { error: insertError } = await supabase
            .from('payroll')
            .insert({
              employee_id: employeeId,
              month: payrollMonth,
              year: payrollYear,
              basic_salary: basicSalary,
              allowances,
              deductions,
              gross_salary: grossSalary,
              net_salary: netSalary,
              status: 'pending',
            } as any);

          if (insertError) throw insertError;
          successCount++;
        } catch (error) {
          console.error(`Error generating payroll for employee ${employeeId}:`, error);
        }
      }

      showNotification(
        'success',
        `Payroll generated for ${successCount} employees${skipCount > 0 ? ` (${skipCount} already exist)` : ''}`
      );

      setShowGenerateModal(false);
      setSelectedEmployees([]);
      loadPayroll();
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-2">Manage salary and payslips</p>
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <>
              <button 
                onClick={handleNotifyAllPayroll}
                disabled={notifying || payrollRecords.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {notifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Notifying...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Notify All</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  loadEmployees();
                  setShowGenerateModal(true);
                }}
                className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                <span>Generate Payroll</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {user?.role !== 'employee' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                    {user?.role !== 'employee' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employees?.first_name} {record.employees?.last_name}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{MONTHS[record.month - 1]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${record.basic_salary.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${record.gross_salary.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${record.net_salary.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPayslip(record);
                        }}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Download</span>
                      </button>
                    </td>
                  </tr>
                  {expandedId === record.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={user?.role === 'employee' ? 6 : 7} className="px-6 py-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            {Object.keys(record.allowances || {}).length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Allowances</h4>
                                <div className="space-y-2">
                                  {Object.entries(record.allowances || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</span>
                                      <span className="font-medium text-gray-900">${(value as number).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {Object.keys(record.deductions || {}).length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Deductions</h4>
                                <div className="space-y-2">
                                  {Object.entries(record.deductions || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</span>
                                      <span className="font-medium text-red-600">-${(value as number).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {payrollRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payroll records found for {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Generate Payroll</h2>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedEmployees([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {/* Month and Year Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Select Employees</label>
                  <button
                    onClick={selectAllEmployees}
                    className="text-xs text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg divide-y max-h-48 overflow-y-auto">
                  {employees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No active employees found
                    </div>
                  ) : (
                    employees.map(emp => (
                      <label key={emp.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => toggleEmployeeSelection(emp.id)}
                          className="rounded text-blue-900 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-900">
                          {emp.first_name} {emp.last_name}
                          <span className="text-gray-500 text-xs ml-2">({emp.position})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedEmployees.length} / {employees.length}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Payroll will be generated with calculated allowances (HRA 10%, DA 8%) and deductions (PF 12%, Tax 5%).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedEmployees([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePayroll}
                disabled={generatingPayroll || selectedEmployees.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPayroll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Generate Payroll</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
