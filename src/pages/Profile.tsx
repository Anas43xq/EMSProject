import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Mail, Phone, Calendar, MapPin, Briefcase, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { PageSpinner, PageHeader, Card, EmptyState } from '../components/ui';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  department_id: string;
  position: string;
  employment_type: string;
  status: string;
  hire_date: string;
  termination_date: string | null;
  salary: number;
  qualifications: any[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  departments?: {
    name: string;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (user?.employeeId) {
      loadEmployee();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments!department_id (name)
        `)
        .eq('id', user!.employeeId!)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        showNotification('error', t('employees.notFound'));
        return;
      }

      setEmployee(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('error', t('employees.failedToLoadDetails'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!user?.employeeId) {
    return (
      <EmptyState
        icon={<User className="w-16 h-16 text-gray-400" />}
        title={t('profile.noProfileLinked')}
        message={t('profile.contactAdmin')}
      />
    );
  }

  if (!employee) {
    return <EmptyState message={t('employees.notFound')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.myProfile')} subtitle={t('profile.viewYourDetails')} />

      {/* Profile Header */}
      <Card>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-900">
              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-600">{employee.position}</p>
            <p className="text-sm text-gray-500">{employee.employee_number}</p>
            <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${
              employee.status === 'active' ? 'bg-green-100 text-green-800' :
              employee.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {employee.status}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-900" />
            <span>{t('employees.personalInfo')}</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.email')}</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.phone')}</p>
                <p className="font-medium">{employee.phone || t('common.na')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.dateOfBirth')}</p>
                <p className="font-medium">
                  {employee.date_of_birth ? format(new Date(employee.date_of_birth), 'PPP') : t('common.na')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.address')}</p>
                <p className="font-medium">
                  {employee.address ? `${employee.address}, ${employee.city}, ${employee.state} ${employee.postal_code}` : t('common.na')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-900" />
            <span>{t('employees.employmentDetails')}</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text,gray-500">{t('employees.department')}</p>
                <p className="font-medium">{employee.departments?.name || t('common.na')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.position')}</p>
                <p className="font-medium">{employee.position}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.hireDate')}</p>
                <p className="font-medium">
                  {employee.hire_date ? format(new Date(employee.hire_date), 'PPP') : t('common.na')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('employees.employmentType')}</p>
              <p className="font-medium capitalize">{employee.employment_type?.replace('-', ' ') || t('common.na')}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-900" />
            <span>{t('employees.emergencyContact')}</span>
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t('common.name')}</p>
              <p className="font-medium">{employee.emergency_contact_name || t('common.na')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('employees.emergencyPhone')}</p>
                <p className="font-medium">{employee.emergency_contact_phone || t('common.na')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
