import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { User } from './types';

interface DeleteUserModalProps {
  show: boolean;
  selectedUser: User | null;
  onDelete: () => void;
  onClose: () => void;
  submitting: boolean;
}

export default function DeleteUserModal({
  show,
  selectedUser,
  onDelete,
  onClose,
  submitting,
}: DeleteUserModalProps) {
  const { t } = useTranslation();

  if (!show || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('userManagement.deleteUser')}</h3>
          <p className="text-gray-600 mb-4">
            {t('userManagement.confirmDelete')} <strong>{selectedUser.email}</strong>? {t('userManagement.cannotBeUndone')}
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onDelete}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? t('common.deleting') : t('userManagement.deleteUserBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
