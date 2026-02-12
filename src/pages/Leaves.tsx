import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { notifyLeaveApproval, notifyLeaveRejection } from '../lib/notifications';
import { Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Leave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
    email: string;
  };
}

export default function Leaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLeaves();
  }, [user]);

  const loadLeaves = async () => {
    try {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            employee_number,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (user?.role === 'employee' && user?.employeeId) {
        query = query.eq('employee_id', user.employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      const leave = leaves.find(l => l.id === leaveId);
      if (!leave) return;

      const { error } = await (supabase
        .from('leaves') as any)
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', leaveId);

      if (error) throw error;

      showNotification('success', 'Leave request approved successfully');

      if (leave.employees?.email) {
        await notifyLeaveApproval(
          leave.employees.email,
          leave.leave_type,
          new Date(leave.start_date).toLocaleDateString(),
          new Date(leave.end_date).toLocaleDateString()
        );
      }

      loadLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      showNotification('error', 'Failed to approve leave request');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      const leave = leaves.find(l => l.id === leaveId);
      if (!leave) return;

      const { error } = await (supabase
        .from('leaves') as any)
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', leaveId);

      if (error) throw error;

      showNotification('success', 'Leave request rejected');

      if (leave.employees?.email) {
        await notifyLeaveRejection(
          leave.employees.email,
          leave.leave_type,
          new Date(leave.start_date).toLocaleDateString(),
          new Date(leave.end_date).toLocaleDateString()
        );
      }

      loadLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      showNotification('error', 'Failed to reject leave request');
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-2">Manage leave applications and balances</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Apply Leave</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <div key={leave.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-900" />
                  </div>
                  <div className="flex-1">
                    {user?.role !== 'employee' && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.employees?.first_name} {leave.employees?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{leave.employees?.employee_number}</p>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {leave.leave_type}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-600">{leave.days_count} days</span>
                    </div>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${
                    leave.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : leave.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {leave.status === 'approved' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : leave.status === 'rejected' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>{leave.status}</span>
                  </span>
                  {(user?.role === 'admin' || user?.role === 'hr') && leave.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(leave.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLeaves.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No leave applications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
