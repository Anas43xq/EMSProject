/*
  # Drop notification_preferences table

  1. Changes
    - Drop notification_preferences table and its trigger function
*/

DROP TABLE IF EXISTS notification_preferences CASCADE;

DROP FUNCTION IF EXISTS update_notification_preferences_updated_at() CASCADE;
