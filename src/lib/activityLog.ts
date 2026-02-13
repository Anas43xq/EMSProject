import { supabase } from './supabase';

export type ActivityAction =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_employee_linked'
  | 'user_employee_unlinked'
  | 'user_password_reset'
  | 'employee_created'
  | 'employee_updated'
  | 'employee_deleted'
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_cancelled'
  | 'department_created'
  | 'department_updated'
  | 'department_deleted'
  | 'attendance_checked_in'
  | 'attendance_checked_out'
  | 'attendance_recorded'
  | 'announcement_created'
  | 'announcement_updated'
  | 'announcement_deleted'
  | 'announcement_toggled'
  | 'user_login'
  | 'user_logout';

export type EntityType =
  | 'user'
  | 'employee'
  | 'leave'
  | 'department'
  | 'attendance'
  | 'announcement';

/**
 * Log an activity to the activity_logs table.
 * This is fire-and-forget - errors are logged but don't block the main operation.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: EntityType,
  entityId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

/**
 * Log multiple activities at once (batch insert)
 */
export async function logActivities(
  activities: Array<{
    userId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId?: string | null;
    details?: Record<string, unknown>;
  }>
): Promise<void> {
  try {
    const records = activities.map((a) => ({
      user_id: a.userId,
      action: a.action,
      entity_type: a.entityType,
      entity_id: a.entityId || null,
      details: a.details || {},
    }));

    const { error } = await supabase.from('activity_logs').insert(records);

    if (error) {
      console.error('Failed to log activities:', error);
    }
  } catch (err) {
    console.error('Error logging activities:', err);
  }
}
