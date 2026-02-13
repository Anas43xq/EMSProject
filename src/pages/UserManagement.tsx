import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { logActivity } from '../lib/activityLog';
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Link2,
  Unlink,
  Mail,
  Key,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface User {
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

interface Employee {
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

interface UserFormData {
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'employee';
  employee_id: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    role: 'employee',
    employee_id: null,
  });

  useEffect(() => {
    loadUsers();
    loadEmployees();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            employee_number,
            position,
            department_id,
            departments!employees_department_id_fkey (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments!employees_department_id_fkey (
            name
          )
        `)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

      // Find employees not linked to any user
      const { data: usersWithEmployees } = await supabase
        .from('users')
        .select('employee_id');
      
      const linkedEmployeeIds = (usersWithEmployees || [])
        .map((u: { employee_id: string | null }) => u.employee_id)
        .filter(Boolean) as string[];

      const unlinked = (data || []).filter((emp: Employee) => !linkedEmployeeIds.includes(emp.id));
      setUnlinkedEmployees(unlinked);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showNotification('error', 'Email and password are required');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      // Create auth user via Supabase Admin API (requires service role key)
      // For now, we'll use signUp which works client-side
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the users table with role and employee link
        const { error: updateError } = await (supabase
          .from('users') as any)
          .upsert({
            id: authData.user.id,
            email: formData.email,
            role: formData.role,
            employee_id: formData.employee_id,
          });

        if (updateError) throw updateError;
      }

      showNotification('success', 'User created successfully. They will receive a confirmation email.');
      
      // Log activity
      if (authData.user && currentUser) {
        logActivity(currentUser.id, 'user_created', 'user', authData.user.id, {
          email: formData.email,
          role: formData.role,
        });
      }

      setShowAddModal(false);
      setFormData({ email: '', password: '', role: 'employee', employee_id: null });
      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error creating user:', error);
      showNotification('error', error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({
          role: formData.role,
          employee_id: formData.employee_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      showNotification('success', 'User updated successfully');
      
      // Log activity
      if (currentUser) {
        logActivity(currentUser.id, 'user_updated', 'user', selectedUser.id, {
          email: selectedUser.email,
          role: formData.role,
        });
      }

      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error updating user:', error);
      showNotification('error', error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // Prevent deleting yourself
    if (selectedUser.id === currentUser?.id) {
      showNotification('error', 'You cannot delete your own account');
      return;
    }

    setSubmitting(true);
    try {
      // Delete from users table (auth.users cascade will handle auth deletion via RLS)
      const { error } = await (supabase
        .from('users') as any)
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      showNotification('success', 'User deleted successfully');
      
      // Log activity
      if (currentUser) {
        logActivity(currentUser.id, 'user_deleted', 'user', selectedUser.id, {
          email: selectedUser.email,
        });
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showNotification('error', error.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkEmployee = async (employeeId: string) => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({
          employee_id: employeeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      showNotification('success', 'Employee linked successfully');
      
      // Log activity
      if (currentUser) {
        logActivity(currentUser.id, 'user_employee_linked', 'user', selectedUser.id, {
          employee_id: employeeId,
        });
      }

      setShowLinkModal(false);
      setSelectedUser(null);
      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error linking employee:', error);
      showNotification('error', error.message || 'Failed to link employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkEmployee = async (userId: string) => {
    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({
          employee_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      showNotification('success', 'Employee unlinked successfully');
      
      // Log activity
      if (currentUser) {
        logActivity(currentUser.id, 'user_employee_unlinked', 'user', userId);
      }

      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error unlinking employee:', error);
      showNotification('error', error.message || 'Failed to unlink employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) throw error;

      showNotification('success', 'Password reset email sent successfully');
      
      // Log activity
      if (currentUser) {
        logActivity(currentUser.id, 'user_password_reset', 'user', selectedUser.id, {
          email: selectedUser.email,
        });
      }

      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      showNotification('error', error.message || 'Failed to send password reset email');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      employee_id: user.employee_id,
    });
    setShowEditModal(true);
  };

  const openLinkModal = (user: User) => {
    setSelectedUser(user);
    setShowLinkModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'hr':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'hr':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employees?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employees?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employees?.employee_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    hr: users.filter(u => u.role === 'hr').length,
    employees: users.filter(u => u.role === 'employee').length,
    linked: users.filter(u => u.employee_id).length,
    unlinked: users.filter(u => !u.employee_id).length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users, roles, and employee links</p>
        </div>
        <button
          onClick={() => {
            setFormData({ email: '', password: '', role: 'employee', employee_id: null });
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <UserCog className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
            </div>
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">HR Staff</p>
              <p className="text-2xl font-bold text-purple-600">{stats.hr}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Employees</p>
              <p className="text-2xl font-bold text-blue-600">{stats.employees}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Linked</p>
              <p className="text-2xl font-bold text-green-600">{stats.linked}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unlinked</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unlinked}</p>
            </div>
            <UserX className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, or employee number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <button
            onClick={() => {
              loadUsers();
              loadEmployees();
            }}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-900 font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.id === currentUser?.id ? '(You)' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.employees ? (
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.employees.first_name} {user.employees.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.employees.employee_number} • {user.employees.position}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkEmployee(user.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Unlink employee"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openLinkModal(user)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Link2 className="w-4 h-4" />
                        <span>Link Employee</span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetPasswordModal(true);
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'hr' | 'employee' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Employee (Optional)</label>
                <select
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- No Employee Link --</option>
                  {unlinkedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only showing employees not linked to a user</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
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
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'hr' | 'employee' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={selectedUser.id === currentUser?.id}
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
                {selectedUser.id === currentUser?.id && (
                  <p className="text-xs text-orange-500 mt-1">You cannot change your own role</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Employee</label>
                <select
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- No Employee Link --</option>
                  {selectedUser.employee_id && selectedUser.employees && (
                    <option value={selectedUser.employee_id}>
                      {selectedUser.employees.first_name} {selectedUser.employees.last_name} ({selectedUser.employees.employee_number}) - Current
                    </option>
                  )}
                  {unlinkedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Employee Modal */}
      {showLinkModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Link Employee</h2>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select an employee to link with <strong>{selectedUser.email}</strong>
              </p>
              {unlinkedEmployees.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {unlinkedEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleLinkEmployee(emp.id)}
                      disabled={submitting}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {emp.employee_number} • {emp.position}
                          </p>
                          {emp.departments && (
                            <p className="text-xs text-gray-400">{emp.departments.name}</p>
                          )}
                        </div>
                        <Link2 className="w-5 h-5 text-blue-600" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserX className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>All employees are already linked to users</p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{selectedUser.email}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-600 mb-4">
                Send a password reset email to <strong>{selectedUser.email}</strong>?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
