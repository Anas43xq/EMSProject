/*
  # Fix Role in JWT Metadata

  ## Problem
  RLS policies check for role in JWT app_metadata but roles are stored in users table.
  When users sign in, their role is not automatically added to the JWT.

  ## Solution
  1. Create a trigger to sync user role to auth.users app_metadata
  2. Update existing users to have role in app_metadata
  3. This ensures RLS policies work correctly

  ## Changes
  - Create function to sync role to JWT metadata
  - Create trigger on users table
  - Update existing users with role metadata
*/

-- Function to sync role to auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth.users app_metadata with role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync role on insert or update
DROP TRIGGER IF EXISTS sync_user_role_trigger ON users;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_metadata();

-- Update existing users to sync their roles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
