import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { User, Lock, Bell, Shield, Edit2, Save, X } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    leave_approvals: true,
    attendance_reminders: true,
    performance_reviews: false,
    payroll_updates: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load notification preferences on mount
  const loadNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setNotificationPrefs({
          leave_approvals: data.email_leave_approvals ?? true,
          attendance_reminders: data.email_attendance_reminders ?? true,
          performance_reviews: data.email_performance_reviews ?? false,
          payroll_updates: data.email_payroll_updates ?? true,
        });
      }
    } catch (error) {
      console.log('No preferences found, using defaults');
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotificationPreferences();
    }
  }, [user?.id]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          email_leave_approvals: notificationPrefs.leave_approvals,
          email_attendance_reminders: notificationPrefs.attendance_reminders,
          email_performance_reviews: notificationPrefs.performance_reviews,
          email_payroll_updates: notificationPrefs.payroll_updates,
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      showNotification('success', 'Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('error', 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    if (newEmail === user?.email) {
      setIsEditingEmail(false);
      return;
    }

    setUpdatingEmail(true);
    try {
      // Get the app URL from environment or use current origin
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/settings`;

      // Update email with redirect options
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: redirectUrl
        }
      );
      
      if (error) throw error;

      showNotification('success', 'Email change request sent! Confirm the change by clicking the link in your email.');
      setIsEditingEmail(false);
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error?.message?.includes('same')) {
        showNotification('info', 'New email is the same as current email');
      } else {
        showNotification('error', 'Failed to update email: ' + (error?.message || 'Please try again'));
      }
      setNewEmail(user?.email || '');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setNewEmail(user?.email || '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center space-x-2">
                  {isEditingEmail ? (
                    <>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new email"
                      />
                      <button
                        onClick={handleEmailUpdate}
                        disabled={updatingEmail}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span className="text-sm">{updatingEmail ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updatingEmail}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => setIsEditingEmail(true)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                    </>
                  )}
                </div>
                {isEditingEmail && (
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-blue-600 font-medium">
                      A confirmation link will be sent to your new email. Once confirmed, your email will be updated.
                    </p>
                    <p className="text-gray-500">
                      Confirmation link will redirect to: <span className="font-mono bg-gray-100 px-1 rounded">{import.meta.env.VITE_APP_URL || window.location.origin}/settings</span>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={user?.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Update Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationPrefs.leave_approvals}
                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, leave_approvals: e.target.checked }))}
                  className="rounded text-blue-900 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email notifications for leave approvals</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationPrefs.attendance_reminders}
                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, attendance_reminders: e.target.checked }))}
                  className="rounded text-blue-900 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email notifications for attendance reminders</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationPrefs.performance_reviews}
                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, performance_reviews: e.target.checked }))}
                  className="rounded text-blue-900 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email notifications for performance reviews</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationPrefs.payroll_updates}
                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, payroll_updates: e.target.checked }))}
                  className="rounded text-blue-900 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email notifications for payroll updates</span>
              </label>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="mt-6 bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Account Info</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Account Type</p>
                <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'hr') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">Administrator Access</h3>
              <p className="text-sm text-blue-800">
                You have administrative privileges to manage employees, departments, and system settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
