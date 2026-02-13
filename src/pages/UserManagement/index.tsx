import { useTranslation } from 'react-i18next';
import { Plus, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { PageSpinner, PageHeader, Button } from '../../components/ui';
import { useUserManagement } from './useUserManagement';
import UserStatsCards from './UserStatsCards';
import UserFilters from './UserFilters';
import UsersTable from './UsersTable';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import LinkEmployeeModal from './LinkEmployeeModal';
import DeleteUserModal from './DeleteUserModal';
import ResetPasswordModal from './ResetPasswordModal';

export default function UserManagement() {
  const { t } = useTranslation();
  const {
    unlinkedEmployees,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    showAddModal,
    setShowAddModal,
    showEditModal,
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
    currentUserId,
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
    filteredUsers,
    stats,
    setShowEditModal,
  } = useUserManagement();

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

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('userManagement.title')}
        subtitle={t('userManagement.subtitle')}
        action={
          <Button
            onClick={() => {
              setFormData({ email: '', password: '', role: 'employee', employee_id: null });
              setShowAddModal(true);
            }}
            icon={<Plus className="w-5 h-5" />}
          >
            {t('userManagement.addUser')}
          </Button>
        }
      />

      <UserStatsCards stats={stats} />

      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onRefresh={() => { loadUsers(); loadEmployees(); }}
      />

      <UsersTable
        filteredUsers={filteredUsers}
        currentUserId={currentUserId}
        onEdit={openEditModal}
        onDelete={(user) => { setSelectedUser(user); setShowDeleteModal(true); }}
        onResetPassword={(user) => { setSelectedUser(user); setShowResetPasswordModal(true); }}
        onLinkEmployee={openLinkModal}
        onUnlinkEmployee={handleUnlinkEmployee}
        getRoleIcon={getRoleIcon}
        getRoleBadge={getRoleBadge}
      />

      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddUser}
        submitting={submitting}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        unlinkedEmployees={unlinkedEmployees}
      />

      <EditUserModal
        show={showEditModal}
        selectedUser={selectedUser}
        currentUserId={currentUserId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditUser}
        onClose={() => setShowEditModal(false)}
        submitting={submitting}
        unlinkedEmployees={unlinkedEmployees}
      />

      <LinkEmployeeModal
        show={showLinkModal}
        selectedUser={selectedUser}
        unlinkedEmployees={unlinkedEmployees}
        onLink={handleLinkEmployee}
        onClose={() => setShowLinkModal(false)}
        submitting={submitting}
      />

      <DeleteUserModal
        show={showDeleteModal}
        selectedUser={selectedUser}
        onDelete={handleDeleteUser}
        onClose={() => setShowDeleteModal(false)}
        submitting={submitting}
      />

      <ResetPasswordModal
        show={showResetPasswordModal}
        selectedUser={selectedUser}
        onReset={handleResetPassword}
        onClose={() => setShowResetPasswordModal(false)}
        submitting={submitting}
      />
    </div>
  );
}
