import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { Plus, Building2, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../lib/activityLog';

interface Department {
  id: string;
  name: string;
  type: string;
  description: string;
  head_id: string | null;
  employees?: { count: number }[];
}

interface DepartmentForm {
  name: string;
  type: string;
  description: string;
  head_id: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DepartmentForm>({
    name: '',
    type: 'academic',
    description: '',
    head_id: '',
  });
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadDepartments();
    if (isAdminOrHR) loadEmployees();
  }, []);

  const loadDepartments = async () => {
    try {
      const { data, error } = await (supabase
        .from('departments') as any)
        .select(`
          *,
          employees!employees_department_id_fkey (count)
        `)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      showNotification('error', 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await (supabase
        .from('employees') as any)
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ name: '', type: 'academic', description: '', head_id: '' });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      type: dept.type,
      description: dept.description || '',
      head_id: dept.head_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('error', 'Department name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        head_id: formData.head_id || null,
      };

      if (editingDept) {
        const { error } = await (supabase
          .from('departments') as any)
          .update(payload)
          .eq('id', editingDept.id);

        if (error) throw error;
        showNotification('success', 'Department updated successfully');
        
        // Log activity
        if (user) {
          logActivity(user.id, 'department_updated', 'department', editingDept.id, {
            name: payload.name,
            type: payload.type,
          });
        }
      } else {
        const { data, error } = await (supabase
          .from('departments') as any)
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        showNotification('success', 'Department added successfully');
        
        // Log activity
        if (user && data) {
          logActivity(user.id, 'department_created', 'department', data.id, {
            name: payload.name,
            type: payload.type,
          });
        }
      }

      setShowModal(false);
      loadDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      showNotification('error', error.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    const empCount = dept.employees?.[0]?.count || 0;
    if (empCount > 0) {
      showNotification('error', `Cannot delete "${dept.name}" — it has ${empCount} employee(s). Reassign them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${dept.name}"?`)) return;

    try {
      const { error } = await (supabase
        .from('departments') as any)
        .delete()
        .eq('id', dept.id);

      if (error) throw error;
      showNotification('success', 'Department deleted successfully');
      
      // Log activity
      if (user) {
        logActivity(user.id, 'department_deleted', 'department', dept.id, {
          name: dept.name,
        });
      }

      loadDepartments();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      showNotification('error', error.message || 'Failed to delete department');
    }
  };

  const getHeadName = (headId: string | null) => {
    if (!headId) return 'Not assigned';
    const emp = employees.find((e) => e.id === headId);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
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
        {isAdminOrHR && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${dept.type === 'academic' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <Building2 className={`w-6 h-6 ${dept.type === 'academic' ? 'text-blue-900' : 'text-green-900'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                  {isAdminOrHR && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  dept.type === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {dept.type}
                </span>
                <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                  <p className="text-sm text-gray-500">
                    Head: <span className="font-medium text-gray-900">{getHeadName(dept.head_id)}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Employees: <span className="font-medium text-gray-900">{dept.employees?.[0]?.count || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="academic">Academic</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
                <select
                  value={formData.head_id}
                  onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">— Not assigned —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDept ? 'Update' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
