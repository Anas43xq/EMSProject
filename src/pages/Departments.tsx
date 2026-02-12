import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Building2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  type: string;
  description: string;
  head_id: string | null;
  employees?: { count: number }[];
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      console.log('Loading departments...');
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          employees!employees_department_id_fkey (count)
        `)
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Departments loaded:', data?.length);
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      showNotification('error', 'Failed to load departments');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-2">Manage academic and administrative departments</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${dept.type === 'academic' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <Building2 className={`w-6 h-6 ${dept.type === 'academic' ? 'text-blue-900' : 'text-green-900'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  dept.type === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {dept.type}
                </span>
                <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Employees: <span className="font-medium text-gray-900">{dept.employees?.[0]?.count || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
