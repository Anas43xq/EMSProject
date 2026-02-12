import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Briefcase, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

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

export default function EmployeeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments!department_id (name)
        `)
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        showNotification('error', 'Employee not found');
        navigate('/employees');
        return;
      }

      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      showNotification('error', 'Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/employees"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-gray-600 mt-1">{employee.position}</p>
          </div>
        </div>
        <Link
          to={`/employees/${id}/edit`}
          className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Employee</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Employee Number</label>
                <p className="text-gray-900">{employee.employee_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <div className="flex items-center text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                    {employee.email}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <div className="flex items-center text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                    {employee.phone || 'N/A'}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {employee.date_of_birth ? format(new Date(employee.date_of_birth), 'PPP') : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                <p className="text-gray-900 capitalize">{employee.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <div className="flex items-start text-gray-900">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p>{employee.address || 'N/A'}</p>
                    {(employee.city || employee.state || employee.postal_code) && (
                      <p className="text-sm text-gray-600">
                        {[employee.city, employee.state, employee.postal_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                <p className="text-gray-900">{employee.departments?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Position</label>
                <p className="text-gray-900">{employee.position}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Employment Type</label>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                  {employee.employment_type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : employee.status === 'on-leave'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Hire Date</label>
                <p className="text-gray-900">{format(new Date(employee.hire_date), 'PPP')}</p>
              </div>
              {employee.termination_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Termination Date</label>
                  <p className="text-gray-900">{format(new Date(employee.termination_date), 'PPP')}</p>
                </div>
              )}
            </div>
          </div>

          {employee.qualifications && employee.qualifications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Qualifications
              </h2>
              <div className="space-y-3">
                {employee.qualifications.map((qual: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-gray-900">{qual.degree}</p>
                    <p className="text-sm text-gray-600">{qual.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <p className="text-gray-900">{employee.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <div className="flex items-center text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {employee.emergency_contact_phone ? (
                    <a href={`tel:${employee.emergency_contact_phone}`} className="hover:text-blue-600">
                      {employee.emergency_contact_phone}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Years of Service</span>
                <span className="font-semibold text-gray-900">
                  {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Employment Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : employee.status === 'on-leave'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
