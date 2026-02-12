import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

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

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAttendance();
  }, [user, selectedDate]);

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

    try {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0].substring(0, 5);

      const { error } = await supabase.from('attendance').insert({
        employee_id: user.employeeId,
        date: selectedDate,
        check_in: time,
        status: 'present' as const,
      } as any);

      if (error) throw error;
      loadAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
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
        {user?.role === 'employee' && (
          <button
            onClick={handleMarkAttendance}
            className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Mark Attendance</span>
          </button>
        )}
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
    </div>
  );
}
