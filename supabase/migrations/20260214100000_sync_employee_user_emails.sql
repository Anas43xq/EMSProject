-- Sync employee emails with user login emails (single source of truth)
-- The user's login email is authoritative; employee.email auto-syncs from it

-- Step 1: Sync existing employees to use their linked user's email
UPDATE public.employees e
SET email = u.email
FROM public.users u
WHERE u.employee_id = e.id
  AND u.email IS NOT NULL;

-- Step 2: Trigger to sync employee email when user email changes
CREATE OR REPLACE FUNCTION sync_employee_email_from_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET email = NEW.email
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_employee_email_on_user_update ON public.users;
CREATE TRIGGER sync_employee_email_on_user_update
  AFTER UPDATE OF email ON public.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_employee_email_from_user();

-- Step 3: Trigger to sync employee email when user is linked to an employee
CREATE OR REPLACE FUNCTION sync_employee_email_on_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET email = NEW.email
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_employee_email_on_user_link ON public.users;
CREATE TRIGGER sync_employee_email_on_user_link
  AFTER UPDATE OF employee_id ON public.users
  FOR EACH ROW
  WHEN (NEW.employee_id IS NOT NULL AND (OLD.employee_id IS NULL OR OLD.employee_id IS DISTINCT FROM NEW.employee_id))
  EXECUTE FUNCTION sync_employee_email_on_link();

-- Also trigger on INSERT (when creating new user with employee link)
DROP TRIGGER IF EXISTS sync_employee_email_on_user_insert ON public.users;
CREATE TRIGGER sync_employee_email_on_user_insert
  AFTER INSERT ON public.users
  FOR EACH ROW
  WHEN (NEW.employee_id IS NOT NULL)
  EXECUTE FUNCTION sync_employee_email_on_link();
