import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { notifyLeaveApproval, notifyLeaveRejection, notifyLeavePending } from '../lib/notifications';
import { Plus, Calendar, CheckCircle, XCircle, Clock, X } from 'lucide-react';

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

interface LeaveFormData {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export default function Leaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [filter, setFilter] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeaveFormData>({
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

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

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.employeeId) {
      showNotification('error', 'Employee ID not found');
      return;
    }

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    const daysCount = calculateDays(formData.start_date, formData.end_date);
    if (daysCount <= 0) {
      showNotification('error', 'End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      // Get employee details for the notification
      const { data: employeeData } = await supabase
        .from('employees')
        .select('first_name, last_name')
        .eq('id', user.employeeId)
        .single() as { data: { first_name: string; last_name: string } | null };

      // Insert leave request
      const { error } = await (supabase
        .from('leaves') as any)
        .insert({
          employee_id: user.employeeId,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: daysCount,
          reason: formData.reason,
          status: 'pending',
        });

      if (error) throw error;

      showNotification('success', 'Leave request submitted successfully');

      // Send email notification to HR/Admin users about the new pending leave request
      const { data: hrAdminUsers } = await supabase
        .from('users')
        .select('email')
        .in('role', ['admin', 'hr']) as { data: { email: string }[] | null };

      if (hrAdminUsers && hrAdminUsers.length > 0 && employeeData) {
        const employeeName = `${employeeData.first_name} ${employeeData.last_name}`;
        const startDateFormatted = new Date(formData.start_date).toLocaleDateString();
        const endDateFormatted = new Date(formData.end_date).toLocaleDateString();

        // Notify all HR and Admin users
        for (const adminUser of hrAdminUsers) {
          await notifyLeavePending(
            adminUser.email,
            employeeName,
            formData.leave_type,
            startDateFormatted,
            endDateFormatted
          );
        }
      }

      // Reset form and close modal
      setFormData({
        leave_type: 'Annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
      setShowApplyModal(false);
      loadLeaves();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showNotification('error', 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
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
        <button 
          onClick={() => setShowApplyModal(true)}
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
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

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Apply for Leave</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleApplyLeave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Personal">Personal Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Duration: <strong>{calculateDays(formData.start_date, formData.end_date)} days</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for your leave request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
