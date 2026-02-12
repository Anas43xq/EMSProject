-- =============================================
-- SEED USERS SCRIPT
-- =============================================
-- Run this AFTER creating auth users in Supabase Dashboard or via API
-- 
-- Step 1: Create users in Supabase Auth (Dashboard > Authentication > Users > Add User):
--   - admin@university.edu / admin123
--   - hr@university.edu / hr123  
--   - employee@university.edu / employee123
--
-- Step 2: Set app_metadata for each user:
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' WHERE email = 'admin@university.edu';
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "hr"}' WHERE email = 'hr@university.edu';
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "employee"}' WHERE email = 'employee@university.edu';
--
-- Step 3: Run this script to link auth users to employees
-- =============================================

-- Link auth users to employees in the users table
INSERT INTO public.users (id, email, role, employee_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_app_meta_data->>'role', 'employee') as role,
  e.id as employee_id
FROM auth.users au
LEFT JOIN public.employees e ON e.email = au.email
WHERE au.email IN ('admin@university.edu', 'hr@university.edu', 'employee@university.edu')
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  employee_id = EXCLUDED.employee_id,
  updated_at = now();

-- Create user preferences for each user
INSERT INTO public.user_preferences (user_id, email_leave_approvals, email_attendance_reminders)
SELECT id, true, true FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample announcements (now that admin user exists)
INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'Welcome to EMS 2026', 
  'The Employee Management System has been updated with new features including announcements, improved leave management, and better attendance tracking.', 
  'high', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1;

INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'Office Closure Notice', 
  'The office will be closed on February 15th for maintenance. Please plan accordingly.', 
  'urgent', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1;

INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'New Health Benefits', 
  'We are pleased to announce improved health benefits starting March 2026. Details will be shared via email.', 
  'normal', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1;

-- Add activity log for system init
INSERT INTO public.activity_logs (user_id, action, entity_type, details)
SELECT id, 'System initialized with seed data', 'system', '{"version": "2.0", "date": "2026-02-12"}'::jsonb
FROM public.users WHERE role = 'admin' LIMIT 1;

SELECT 'Seed completed successfully! Users linked:' as status;
SELECT email, role FROM public.users;
