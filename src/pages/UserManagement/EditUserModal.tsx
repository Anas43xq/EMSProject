import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { User, Employee, UserFormData } from './types';

interface EditUserModalProps {
  show: boolean;
  selectedUser: User | null;
  currentUserId: string | undefined;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  unlinkedEmployees: Employee[];
}

export default function EditUserModal({
  show,
  selectedUser,
  currentUserId,
  formData,
  setFormData,
  onSubmit,
  onClose,
  submitting,
  unlinkedEmployees,
}: EditUserModalProps) {
  const { t } = useTranslation();

  if (!show || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('userManagement.editUser')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.email')}</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('userManagement.emailCannotChange')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.role')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'hr' | 'employee' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={selectedUser.id === currentUserId}
            >
              <option value="employee">{t('userManagement.employee')}</option>
              <option value="hr">{t('userManagement.hr')}</option>
              <option value="admin">{t('userManagement.admin')}</option>
            </select>
            {selectedUser.id === currentUserId && (
              <p className="text-xs text-orange-500 mt-1">{t('userManagement.cannotChangeOwnRole')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.linkEmployee')}</label>
            <select
              value={formData.employee_id || ''}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('userManagement.noEmployeeLink')}</option>
              {selectedUser.employee_id && selectedUser.employees && (
                <option value={selectedUser.employee_id}>
                  {selectedUser.employees.first_name} {selectedUser.employees.last_name} ({selectedUser.employees.employee_number}) - {t('userManagement.current')}
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
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {submitting ? t('common.saving') : t('userManagement.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
