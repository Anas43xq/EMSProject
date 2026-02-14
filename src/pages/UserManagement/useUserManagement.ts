import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { logActivity } from '../../lib/activityLog';
import type { User, Employee, UserFormData } from './types';

export function useUserManagement() {
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
  const { t } = useTranslation();

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
      showNotification('error', t('userManagement.failedToLoad'));
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
      showNotification('error', t('userManagement.emailAndPasswordRequired'));
      return;
    }

    if (formData.password.length < 6) {
      showNotification('error', t('userManagement.passwordMinLength'));
      return;
    }

    setSubmitting(true);
    try {
      // Create auth user with role in user_metadata
      // The database trigger handle_new_auth_user will automatically create the public.users record
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
        // Wait a moment for the database trigger to create the user record
        await new Promise(resolve => setTimeout(resolve, 500));

        // Only update the employee_id if one was selected (the trigger already created the user)
        if (formData.employee_id) {
          const { error: updateError } = await (supabase
            .from('users') as any)
            .update({
              employee_id: formData.employee_id,
              role: formData.role,
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.warn('Could not update employee_id:', updateError);
          }
        }
      }

      showNotification('success', t('userManagement.userCreated'));
      
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
      showNotification('error', error.message || t('userManagement.failedToCreate'));
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

      showNotification('success', t('userManagement.userUpdated'));
      
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
      showNotification('error', error.message || t('userManagement.failedToUpdate'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === currentUser?.id) {
      showNotification('error', t('userManagement.cannotDeleteSelf'));
      return;
    }

    setSubmitting(true);
    try {
      // First delete from public.users table
      const { error: dbError } = await (supabase
        .from('users') as any)
        .delete()
        .eq('id', selectedUser.id);

      if (dbError) throw dbError;

      // Then delete from auth.users using edge function or admin API
      // Note: Deleting from auth.users requires service_role key which should be done server-side
      // For now, the user record is deleted from public.users
      // The auth record will remain but won't have access due to RLS policies

      showNotification('success', t('userManagement.userDeleted'));
      
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
      showNotification('error', error.message || t('userManagement.failedToDelete'));
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

      showNotification('success', t('userManagement.employeeLinked'));
      
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
      showNotification('error', error.message || t('userManagement.failedToLink'));
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

      showNotification('success', t('userManagement.employeeUnlinked'));
      
      if (currentUser) {
        logActivity(currentUser.id, 'user_employee_unlinked', 'user', userId);
      }

      loadUsers();
      loadEmployees();
    } catch (error: any) {
      console.error('Error unlinking employee:', error);
      showNotification('error', error.message || t('userManagement.failedToUnlink'));
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

      showNotification('success', t('userManagement.resetEmailSent'));
      
      if (currentUser) {
        logActivity(currentUser.id, 'user_password_reset', 'user', selectedUser.id, {
          email: selectedUser.email,
        });
      }

      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      showNotification('error', error.message || t('userManagement.failedToResetPassword'));
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

  return {
    // State
    users,
    unlinkedEmployees,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    showLinkModal,
    setShowLinkModal,
    showResetPasswordModal,
    setShowResetPasswordModal,
    selectedUser,
    setSelectedUser,
    submitting,
    showPassword,
    setShowPassword,
    formData,
    setFormData,
    currentUserId: currentUser?.id,

    // Actions
    loadUsers,
    loadEmployees,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleLinkEmployee,
    handleUnlinkEmployee,
    handleResetPassword,
    openEditModal,
    openLinkModal,

    // Computed
    filteredUsers,
    stats,
  };
}
