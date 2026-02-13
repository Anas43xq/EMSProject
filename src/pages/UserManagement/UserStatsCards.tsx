import { useTranslation } from 'react-i18next';
import {
  UserCog,
  ShieldAlert,
  ShieldCheck,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';

interface UserStatsCardsProps {
  stats: {
    total: number;
    admins: number;
    hr: number;
    employees: number;
    linked: number;
    unlinked: number;
  };
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.totalUsers')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <UserCog className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.admins')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.hrStaff')}</p>
            <p className="text-2xl font-bold text-purple-600">{stats.hr}</p>
          </div>
          <ShieldCheck className="w-8 h-8 text-purple-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.employees')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.employees}</p>
          </div>
          <Shield className="w-8 h-8 text-blue-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.linked')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.linked}</p>
          </div>
          <UserCheck className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('userManagement.unlinked')}</p>
            <p className="text-2xl font-bold text-orange-600">{stats.unlinked}</p>
          </div>
          <UserX className="w-8 h-8 text-orange-400" />
        </div>
      </div>
    </div>
  );
}
