import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { notifyLeaveApproval, notifyLeaveRejection, notifyLeavePending } from '../lib/notifications';
import { logActivity } from '../lib/activityLog';
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

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  annual_total: number;
  annual_used: number;
  sick_total: number;
  sick_used: number;
  casual_total: number;
  casual_used: number;
}

export default function Leaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [formData, setFormData] = useState<LeaveFormData>({
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    loadLeaves();
    loadLeaveBalance();
  }, [user]);

  const loadLeaveBalance = async () => {
    if (!user?.employeeId) return;
    
    const currentYear = new Date().getFullYear();
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', user.employeeId)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading leave balance:', error);
        return;
      }

      if (data) {
        setLeaveBalance(data);
      } else {
        // Create default balance if none exists
        const { data: newBalance, error: insertError } = await (supabase
          .from('leave_balances') as any)
          .insert({
            employee_id: user.employeeId,
            year: currentYear,
            annual_total: 20,
            annual_used: 0,
            sick_total: 10,
            sick_used: 0,
            casual_total: 10,
            casual_used: 0,
          })
          .select()
          .single();

        if (!insertError && newBalance) {
          setLeaveBalance(newBalance);
        }
      }
    } catch (error) {
      console.error('Error loading leave balance:', error);
    }
  };

  const getAvailableBalance = (leaveType: string): number => {
    if (!leaveBalance) return 0;
    switch (leaveType) {
      case 'Annual':
        return leaveBalance.annual_total - leaveBalance.annual_used;
      case 'Sick':
        return leaveBalance.sick_total - leaveBalance.sick_used;
      case 'Personal':
      case 'Casual':
        return leaveBalance.casual_total - leaveBalance.casual_used;
      default:
        return 999; // Unlimited for special leave types
    }
  };

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

  const updateLeaveBalance = async (employeeId: string, leaveType: string, days: number, action: 'add' | 'subtract') => {
    const currentYear = new Date().getFullYear();
    let fieldToUpdate = '';
    
    switch (leaveType) {
      case 'Annual':
        fieldToUpdate = 'annual_used';
        break;
      case 'Sick':
        fieldToUpdate = 'sick_used';
        break;
      case 'Personal':
      case 'Casual':
        fieldToUpdate = 'casual_used';
        break;
      default:
        return; // Don't track special leave types
    }

    try {
      // Get current balance
      const { data: currentBalance } = await supabase
        .from('leave_balances')
        .select(fieldToUpdate)
        .eq('employee_id', employeeId)
        .eq('year', currentYear)
        .single();

      if (currentBalance) {
        const currentValue = (currentBalance as Record<string, number>)[fieldToUpdate] || 0;
        const newValue = action === 'add' ? currentValue + days : Math.max(0, currentValue - days);

        await (supabase
          .from('leave_balances') as any)
          .update({ [fieldToUpdate]: newValue })
          .eq('employee_id', employeeId)
          .eq('year', currentYear);
      }
    } catch (error) {
      console.error('Error updating leave balance:', error);
    }
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

    // Validate against leave balance
    const availableBalance = getAvailableBalance(formData.leave_type);
    if (daysCount > availableBalance && availableBalance !== 999) {
      showNotification('error', `Insufficient ${formData.leave_type} leave balance. Available: ${availableBalance} days`);
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

      showNotification('success', t('leaves.leaveSubmitted'));

      // Log activity
      if (user) {
        logActivity(user.id, 'leave_requested', 'leave', undefined, {
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: daysCount,
        });
      }

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

      // Deduct from leave balance
      await updateLeaveBalance(leave.employee_id, leave.leave_type, leave.days_count, 'add');

      showNotification('success', t('leaves.leaveApproved'));

      // Log activity
      if (user) {
        logActivity(user.id, 'leave_approved', 'leave', leaveId, {
          employee_id: leave.employee_id,
          leave_type: leave.leave_type,
        });
      }

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

      showNotification('success', t('leaves.leaveRejected'));

      // Log activity
      if (user) {
        logActivity(user.id, 'leave_rejected', 'leave', leaveId, {
          employee_id: leave.employee_id,
          leave_type: leave.leave_type,
        });
      }

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
          <h1 className="text-3xl font-bold text-gray-900">{t('leaves.title')}</h1>
          <p className="text-gray-600 mt-2">{t('leaves.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowApplyModal(true)}
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{t('leaves.applyLeave')}</span>
        </button>
      </div>

      {/* Leave Balance Cards */}
      {user?.role === 'employee' && leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('leaves.annualLeave')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {leaveBalance.annual_total - leaveBalance.annual_used}
                  <span className="text-sm font-normal text-gray-500"> / {leaveBalance.annual_total}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-900" />
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${((leaveBalance.annual_total - leaveBalance.annual_used) / leaveBalance.annual_total) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('leaves.sickLeave')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {leaveBalance.sick_total - leaveBalance.sick_used}
                  <span className="text-sm font-normal text-gray-500"> / {leaveBalance.sick_total}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${((leaveBalance.sick_total - leaveBalance.sick_used) / leaveBalance.sick_total) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('leaves.casualLeave')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {leaveBalance.casual_total - leaveBalance.casual_used}
                  <span className="text-sm font-normal text-gray-500"> / {leaveBalance.casual_total}</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${((leaveBalance.casual_total - leaveBalance.casual_used) / leaveBalance.casual_total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('leaves.all')}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('leaves.pending')}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('leaves.approved')}
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('leaves.rejected')}
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
                      <span className="text-sm text-gray-600">{leave.days_count} {t('common.days')}</span>
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
            <p className="text-gray-500">{t('leaves.noLeaves')}</p>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('leaves.applyForLeave')}</h2>
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
                  {t('leaves.leaveType')}
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Annual">{t('leaves.annual')}</option>
                  <option value="Sick">{t('leaves.sick')}</option>
                  <option value="Personal">{t('leaves.personal')}</option>
                  <option value="Maternity">{t('leaves.maternity')}</option>
                  <option value="Paternity">{t('leaves.paternity')}</option>
                  <option value="Emergency">{t('leaves.emergency')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('leaves.startDate')}
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
                    {t('leaves.endDate')}
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
                <div className="space-y-2">
                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {t('leaves.duration')}: <strong>{calculateDays(formData.start_date, formData.end_date)} {t('common.days')}</strong>
                    </p>
                  </div>
                  {leaveBalance && getAvailableBalance(formData.leave_type) !== 999 && (
                    <div className={`px-3 py-2 rounded-lg ${
                      calculateDays(formData.start_date, formData.end_date) > getAvailableBalance(formData.leave_type)
                        ? 'bg-red-50 text-red-800'
                        : 'bg-green-50 text-green-800'
                    }`}>
                      <p className="text-sm">
                        Available {formData.leave_type} balance: <strong>{getAvailableBalance(formData.leave_type)} {t('common.days')}</strong>
                        {calculateDays(formData.start_date, formData.end_date) > getAvailableBalance(formData.leave_type) && (
                          <span className="block text-red-600 font-medium mt-1">{t('leaves.insufficientBalance')}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('leaves.reason')}
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder={t('leaves.reasonPlaceholder')}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('leaves.submitting')}</span>
                    </>
                  ) : (
                    <span>{t('leaves.submitRequest')}</span>
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
