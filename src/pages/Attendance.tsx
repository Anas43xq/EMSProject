import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar, Plus, X } from 'lucide-react';

interface AttendanceRecord {
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal state for HR/Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '17:00',
    status: 'present' as 'present' | 'absent' | 'late' | 'half-day',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAttendance();
    if (user?.role === 'admin' || user?.role === 'hr') {
      loadEmployees();
    }
  }, [user, selectedDate]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            employee_number
          )
        `)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (user?.role === 'employee' && user?.employeeId) {
        query = query.eq('employee_id', user.employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!user?.employeeId) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0].substring(0, 5);

      const { error } = await supabase.from('attendance').insert({
        employee_id: user.employeeId,
        date: today,
        check_in: time,
        status: 'present' as const,
      } as any);

      if (error) throw error;
      
      // If viewing today, reload to show new record
      if (selectedDate === today) {
        loadAttendance();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const openAddModal = () => {
    setFormData({
      employee_id: '',
      date: selectedDate,
      check_in: '09:00',
      check_out: '17:00',
      status: 'present',
      notes: '',
    });
    setError('');
    setShowAddModal(true);
  };

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.employee_id) {
        setError('Please select an employee');
        setSubmitting(false);
        return;
      }

      const { error } = await (supabase.from('attendance') as any).insert({
        employee_id: formData.employee_id,
        date: formData.date,
        check_in: formData.check_in || null,
        check_out: formData.check_out || null,
        status: formData.status,
        notes: formData.notes,
      });

      if (error) throw error;
      
      setShowAddModal(false);
      // If the added date matches selected date, reload
      if (formData.date === selectedDate) {
        loadAttendance();
      }
    } catch (err: any) {
      console.error('Error adding attendance:', err);
      setError(err.message || 'Failed to add attendance');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-2">Track daily attendance and working hours</p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role === 'employee' && selectedDate === new Date().toISOString().split('T')[0] && (
            <button
              onClick={handleMarkAttendance}
              className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>Mark Attendance</span>
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Attendance</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-4">
          {attendanceRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    record.status === 'present' ? 'bg-green-100' :
                    record.status === 'late' ? 'bg-yellow-100' :
                    record.status === 'absent' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {record.status === 'present' ? (
                      <CheckCircle className="w-6 h-6 text-green-900" />
                    ) : record.status === 'absent' ? (
                      <XCircle className="w-6 h-6 text-red-900" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-900" />
                    )}
                  </div>
                  <div>
                    {user?.role !== 'employee' && (
                      <p className="text-sm font-medium text-gray-900">
                        {record.employees?.first_name} {record.employees?.last_name}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Check In: {record.check_in || 'N/A'}</span>
                      <span>Check Out: {record.check_out || 'N/A'}</span>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {attendanceRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No attendance records for this date</p>
          </div>
        )}
      </div>

      {/* Add Attendance Modal for HR/Admin */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Attendance Record</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAttendance} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input
                    type="time"
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={formData.check_out}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
