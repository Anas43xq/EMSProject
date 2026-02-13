import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff } from 'lucide-react';
import type { Employee, UserFormData } from './types';

interface AddUserModalProps {
  show: boolean;
  onClose: () => void;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  unlinkedEmployees: Employee[];
}

export default function AddUserModal({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  submitting,
  showPassword,
  setShowPassword,
  unlinkedEmployees,
}: AddUserModalProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('userManagement.addNewUser')}</h2>
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.password')}</label>
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
            <p className="text-xs text-gray-500 mt-1">{t('userManagement.minChars')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.role')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'hr' | 'employee' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employee">{t('userManagement.employee')}</option>
              <option value="hr">{t('userManagement.hr')}</option>
              <option value="admin">{t('userManagement.admin')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('userManagement.linkToEmployee')}</label>
            <select
              value={formData.employee_id || ''}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('userManagement.noEmployeeLink')}</option>
              {unlinkedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('userManagement.onlyUnlinked')}</p>
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
              {submitting ? t('common.creating') : t('userManagement.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
