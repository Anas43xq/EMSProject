import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../lib/activityLog';
import { Megaphone, Plus, Edit2, Trash2, X, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Announcements() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    is_active: true,
    expires_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const PRIORITY_CONFIG = {
    low: { label: t('announcements.low'), color: 'bg-gray-100 text-gray-700', icon: Info },
    normal: { label: t('announcements.normal'), color: 'bg-blue-100 text-blue-700', icon: Bell },
    high: { label: t('announcements.high'), color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    urgent: { label: t('announcements.urgent'), color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      // For admin/hr, we want to see ALL announcements including inactive
      const { data, error } = await (supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false }) as any) as { data: Announcement[] | null; error: any };

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      is_active: true,
      expires_at: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_active: announcement.is_active,
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.title.trim()) {
        setError(t('announcements.titleRequired'));
        setSubmitting(false);
        return;
      }

      if (!formData.content.trim()) {
        setError(t('announcements.contentRequired'));
        setSubmitting(false);
        return;
      }

      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        is_active: formData.is_active,
        expires_at: formData.expires_at || null,
        created_by: user?.id,
      };

      if (editingAnnouncement) {
        const { error } = await (supabase
          .from('announcements') as any)
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        
        // Log activity
        if (user) {
          logActivity(user.id, 'announcement_updated', 'announcement', editingAnnouncement.id, {
            title: announcementData.title,
          });
        }
      } else {
        const { data, error } = await (supabase
          .from('announcements') as any)
          .insert(announcementData)
          .select()
          .single();

        if (error) throw error;
        
        // Log activity
        if (user && data) {
          logActivity(user.id, 'announcement_created', 'announcement', data.id, {
            title: announcementData.title,
          });
        }
      }

      setShowModal(false);
      loadAnnouncements();
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setError(err.message || t('announcements.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('announcements.confirmDelete'))) return;

    try {
      const { error } = await (supabase
        .from('announcements')
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
      
      // Log activity
      if (user) {
        logActivity(user.id, 'announcement_deleted', 'announcement', id);
      }

      loadAnnouncements();
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      alert(err.message || t('announcements.deleteFailed'));
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      const { error } = await (supabase
        .from('announcements') as any)
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) throw error;
      
      // Log activity
      if (user) {
        logActivity(user.id, 'announcement_toggled', 'announcement', announcement.id, {
          is_active: !announcement.is_active,
        });
      }

      loadAnnouncements();
    } catch (err: any) {
      console.error('Error toggling announcement:', err);
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
          <h1 className="text-3xl font-bold text-gray-900">{t('announcements.title')}</h1>
          <p className="text-gray-600 mt-2">{t('announcements.subtitle')}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{t('announcements.newAnnouncement')}</span>
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('announcements.noAnnouncements')}</h3>
          <p className="text-gray-500 mb-4">{t('announcements.createFirst')}</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t('announcements.createAnnouncement')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const priorityConfig = PRIORITY_CONFIG[announcement.priority];
            const PriorityIcon = priorityConfig.icon;
            const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
                  !announcement.is_active || isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {priorityConfig.label}
                      </span>
                      {!announcement.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {t('announcements.inactive')}
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          {t('announcements.expired')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{t('announcements.created')}: {new Date(announcement.created_at).toLocaleDateString()}</span>
                      {announcement.expires_at && (
                        <span>{t('announcements.expires')}: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(announcement)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        announcement.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {announcement.is_active ? t('announcements.deactivate') : t('announcements.activate')}
                    </button>
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAnnouncement ? t('announcements.editAnnouncement') : t('announcements.newAnnouncement')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('announcements.announcementTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('announcements.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('announcements.content')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('announcements.contentPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.priority')}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">{t('announcements.low')}</option>
                    <option value="normal">{t('announcements.normal')}</option>
                    <option value="high">{t('announcements.high')}</option>
                    <option value="urgent">{t('announcements.urgent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('announcements.expiresOn')}</label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  {t('announcements.activeLabel')}
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('common.saving') : editingAnnouncement ? t('announcements.update') : t('announcements.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
