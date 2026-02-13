import { supabase } from './supabase';

export type NotificationType = 'leave' | 'attendance' | 'system';

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
    });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }>
): Promise<void> {
  try {
    const records = notifications.map((n) => ({
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
    }));

    const { error } = await supabase.from('notifications').insert(records);

    if (error) {
      console.error('Failed to create notifications:', error);
    }
  } catch (err) {
    console.error('Error creating notifications:', err);
  }
}

/**
 * Notify all HR and Admin users
 */
export async function notifyHRAndAdmins(
  title: string,
  message: string,
  type: NotificationType
): Promise<void> {
  try {
    // Get all HR and Admin user IDs
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'hr']);

    if (fetchError) {
      console.error('Failed to fetch HR/Admin users:', fetchError);
      return;
    }

    if (!users || users.length === 0) return;

    const notifications = users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
    }));

    await createNotifications(notifications);
  } catch (err) {
    console.error('Error notifying HR/Admins:', err);
  }
}

/**
 * Fetch unread notifications for a user
 */
export async function fetchUnreadNotifications(
  userId: string
): Promise<DbNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

/**
 * Fetch all notifications for a user (with optional limit)
 */
export async function fetchNotifications(
  userId: string,
  limit: number = 50
): Promise<DbNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to delete notification:', error);
    }
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
}
