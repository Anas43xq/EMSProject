import { useTranslation } from 'react-i18next';
import { X, Link2, UserX } from 'lucide-react';
import type { User, Employee } from './types';

interface LinkEmployeeModalProps {
  show: boolean;
  selectedUser: User | null;
  unlinkedEmployees: Employee[];
  onLink: (employeeId: string) => void;
  onClose: () => void;
  submitting: boolean;
}

export default function LinkEmployeeModal({
  show,
  selectedUser,
  unlinkedEmployees,
  onLink,
  onClose,
  submitting,
}: LinkEmployeeModalProps) {
  const { t } = useTranslation();

  if (!show || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('userManagement.linkEmployee')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            {t('userManagement.selectEmployeeToLink')} <strong>{selectedUser.email}</strong>
          </p>
          {unlinkedEmployees.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unlinkedEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => onLink(emp.id)}
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
              <p>{t('userManagement.allLinked')}</p>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
