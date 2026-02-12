import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { TrendingUp, Star, X } from 'lucide-react';

interface Review {
  id: string;
  review_period: string;
  review_date: string;
  overall_rating: number | null;
  achievements: string;
  areas_of_improvement: string;
  comments: string;
  status: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

export default function Performance() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    employee_id: '',
    review_period: '',
    review_date: new Date().toISOString().split('T')[0],
    overall_rating: 3,
    goals: '',
    achievements: '',
    areas_of_improvement: '',
    comments: '',
    status: 'draft' as 'draft' | 'submitted' | 'completed',
  });

  useEffect(() => {
    loadReviews();
    if (user?.role === 'admin' || user?.role === 'hr') {
      loadEmployees();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('performance_reviews')
        .select(`
          *,
          employees!employee_id (
            first_name,
            last_name,
            employee_number
          )
        `)
        .order('review_date', { ascending: false });

      if (user?.role === 'employee' && user?.employeeId) {
        query = query.eq('employee_id', user.employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      showNotification('error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('status', 'active')
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'overall_rating' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.review_period) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const goalsArray = formData.goals
        .split('\n')
        .filter(g => g.trim())
        .map(g => ({ goal: g.trim() }));

      const reviewData = {
        employee_id: formData.employee_id,
        reviewer_id: user?.id,
        review_period: formData.review_period,
        review_date: formData.review_date,
        overall_rating: formData.overall_rating,
        goals: goalsArray,
        achievements: formData.achievements,
        areas_of_improvement: formData.areas_of_improvement,
        comments: formData.comments,
        status: formData.status,
      };

      const { error } = await supabase
        .from('performance_reviews')
        .insert(reviewData as any);

      if (error) throw error;

      showNotification('success', 'Performance review created successfully');
      setShowModal(false);
      setFormData({
        employee_id: '',
        review_period: '',
        review_date: new Date().toISOString().split('T')[0],
        overall_rating: 3,
        goals: '',
        achievements: '',
        areas_of_improvement: '',
        comments: '',
        status: 'draft',
      });
      loadReviews();
    } catch (error: any) {
      console.error('Error creating review:', error);
      showNotification('error', error.message || 'Failed to create review');
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600 mt-2">Track performance reviews and goals</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span>New Review</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                {user?.role !== 'employee' && (
                  <p className="text-lg font-bold text-gray-900">
                    {review.employees?.first_name} {review.employees?.last_name}
                  </p>
                )}
                <p className="text-sm text-gray-600">Review Period: {review.review_period}</p>
                <p className="text-sm text-gray-600">Date: {new Date(review.review_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-2">
                {review.overall_rating && (
                  <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">
                      {review.overall_rating}/5
                    </span>
                  </div>
                )}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  review.status === 'completed' ? 'bg-green-100 text-green-800' :
                  review.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {review.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {review.achievements && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Achievements</h4>
                  <p className="text-sm text-gray-600">{review.achievements}</p>
                </div>
              )}

              {review.areas_of_improvement && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Areas of Improvement</h4>
                  <p className="text-sm text-gray-600">{review.areas_of_improvement}</p>
                </div>
              )}

              {review.comments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Comments</h4>
                  <p className="text-sm text-gray-600">{review.comments}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No performance reviews found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">New Performance Review</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="review_period"
                    value={formData.review_period}
                    onChange={handleChange}
                    placeholder="e.g., Q1 2026, Annual 2026"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="review_date"
                    value={formData.review_date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating: {formData.overall_rating}/5
                  </label>
                  <input
                    type="range"
                    name="overall_rating"
                    min="1"
                    max="5"
                    value={formData.overall_rating}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Needs Improvement</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goals (one per line)
                  </label>
                  <textarea
                    name="goals"
                    value={formData.goals}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter goals, one per line"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievements
                  </label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe key achievements and contributions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas for Improvement
                  </label>
                  <textarea
                    name="areas_of_improvement"
                    value={formData.areas_of_improvement}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Identify areas where improvement is needed"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional feedback or notes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
