/*
  # Comprehensive Employee Management System Database
  
  ## Overview
  Complete end-to-end database schema for EMS including:
  - All table definitions
  - Row Level Security policies
  - Indexes for performance
  - Seed data for testing
  
  ## Tables
  - users (linked to auth.users)
  - departments (5 departments)
  - employees (30 employees)
  - leaves (leave requests)
  - leave_balances (annual/sick/casual tracking)
  - attendance (daily records)
  - notifications (system notifications)
  - activity_logs (audit trail)
  - announcements (company news)
  - user_preferences (notification settings)
  
  ## Demo Users
  - admin@university.edu / admin123 (Admin)
  - hr@university.edu / hr123 (HR)
  - employee@university.edu / emp123 (Employee)
  
  ## Notes
  - RLS policies use JWT metadata to avoid infinite recursion
  - All timestamps use timestamptz
  - UUIDs for primary keys
*/

-- =============================================
-- DROP EXISTING TABLES (Clean Slate)
-- =============================================

-- Drop policies first (they depend on tables)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on tables we're about to drop
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop triggers
DROP TRIGGER IF EXISTS update_announcements_updated_at_trigger ON public.announcements;
DROP FUNCTION IF EXISTS update_announcements_updated_at();

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TABLE IF EXISTS performance_reviews CASCADE;

DROP TABLE IF EXISTS payroll CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Users table (links to Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'employee')),
  employee_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academic', 'administrative')),
  head_id UUID,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave')),
  hire_date DATE NOT NULL,
  termination_date DATE,
  salary NUMERIC(12,2) DEFAULT 0,
  photo_url TEXT,
  qualifications JSONB DEFAULT '[]'::jsonb,
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraints after employees table exists
ALTER TABLE public.departments ADD CONSTRAINT fk_department_head 
  FOREIGN KEY (head_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.users ADD CONSTRAINT fk_user_employee 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Leaves table
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'sabbatical')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leave balances table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_total INTEGER DEFAULT 20,
  annual_used INTEGER DEFAULT 0,
  sick_total INTEGER DEFAULT 10,
  sick_used INTEGER DEFAULT 0,
  casual_total INTEGER DEFAULT 10,
  casual_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, year)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave', 'attendance', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  email_leave_approvals BOOLEAN DEFAULT true,
  email_attendance_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_email ON public.employees(email);
CREATE INDEX idx_leaves_employee ON public.leaves(employee_id);
CREATE INDEX idx_leaves_status ON public.leaves(status);
CREATE INDEX idx_leave_balances_employee ON public.leave_balances(employee_id);
CREATE INDEX idx_attendance_employee ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_announcements_active ON public.announcements(is_active) WHERE is_active = true;
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at for announcements
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at_trigger
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- =============================================
-- EMAIL SYNC TRIGGERS (Single source of truth)
-- =============================================
-- The user's login email is authoritative; employee.email auto-syncs from it

-- Trigger to sync employee email when user email changes
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

-- Trigger to sync employee email when user is linked to an employee
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

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Using JWT metadata to avoid recursion
-- =============================================

-- Helper function to get role from JWT with fallback to users table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  jwt_role TEXT;
  db_role TEXT;
BEGIN
  -- First try to get role from JWT app_metadata (fastest)
  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';
  
  IF jwt_role IS NOT NULL THEN
    RETURN jwt_role;
  END IF;
  
  -- Fallback: query the users table directly
  -- This is safe because function is SECURITY DEFINER (bypasses RLS)
  SELECT role INTO db_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Return the database role or default to 'employee'
  RETURN COALESCE(db_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get employee_id for current user
CREATE OR REPLACE FUNCTION get_user_employee_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT employee_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== USERS POLICIES =====
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- ===== DEPARTMENTS POLICIES =====
CREATE POLICY "departments_select_all" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_insert_admin_hr" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "departments_update_admin_hr" ON public.departments
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "departments_delete_admin" ON public.departments
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ===== EMPLOYEES POLICIES =====
CREATE POLICY "employees_select_all" ON public.employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "employees_insert_admin_hr" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "employees_update_admin_hr" ON public.employees
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ===== LEAVES POLICIES =====
CREATE POLICY "leaves_select_own_or_admin_hr" ON public.leaves
  FOR SELECT TO authenticated
  USING (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "leaves_insert_own" ON public.leaves
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "leaves_update_admin_hr" ON public.leaves
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "leaves_delete_admin_hr" ON public.leaves
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

-- ===== LEAVE BALANCES POLICIES =====
CREATE POLICY "leave_balances_select_own_or_admin_hr" ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "leave_balances_manage_admin_hr" ON public.leave_balances
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

-- ===== ATTENDANCE POLICIES =====
CREATE POLICY "attendance_select_own_or_admin_hr" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "attendance_insert_own_or_admin_hr" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "attendance_update_admin_hr" ON public.attendance
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "attendance_delete_admin_hr" ON public.attendance
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));


-- ===== NOTIFICATIONS POLICIES =====
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_all" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===== ACTIVITY LOGS POLICIES =====
CREATE POLICY "activity_logs_select_admin" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "activity_logs_insert_all" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ===== USER PREFERENCES POLICIES =====
CREATE POLICY "user_preferences_select_own" ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update_own" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ===== ANNOUNCEMENTS POLICIES =====
CREATE POLICY "announcements_select_active" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "announcements_select_admin_hr" ON public.announcements
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

CREATE POLICY "announcements_manage_admin_hr" ON public.announcements
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'hr'))
  WITH CHECK (get_user_role() IN ('admin', 'hr'));

-- =============================================
-- SEED DATA
-- =============================================

-- Insert Departments
INSERT INTO public.departments (id, name, type, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Technology', 'administrative', 'Technology and IT Services'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Business Operations', 'administrative', 'Business Operations and Management'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Engineering', 'administrative', 'Engineering and Development'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Human Resources', 'administrative', 'Human Resources and Recruitment'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Administration', 'administrative', 'General Administration and Support');

-- Insert Employees (30 employees)
INSERT INTO public.employees (id, employee_number, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, postal_code, department_id, position, employment_type, status, hire_date, salary, qualifications, emergency_contact_name, emergency_contact_phone) VALUES
  -- Admin Employee
  ('650e8400-e29b-41d4-a716-446655440001', 'EMP001', 'John', 'Smith', 'admin@university.edu', '555-0101', '1975-03-15', 'male', '123 Admin St', 'Boston', 'MA', '02101', '550e8400-e29b-41d4-a716-446655440005', 'System Administrator', 'full-time', 'active', '2010-01-15', 95000, '[{"degree": "MBA", "institution": "Harvard University"}]', 'Jane Smith', '555-0102'),
  -- HR Employee
  ('650e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Sarah', 'Johnson', 'hr@university.edu', '555-0103', '1982-07-22', 'female', '456 HR Ave', 'Boston', 'MA', '02102', '550e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'full-time', 'active', '2015-03-20', 75000, '[{"degree": "MS Human Resources", "institution": "Boston College"}]', 'Mike Johnson', '555-0104'),
  -- Regular Employee
  ('650e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Michael', 'Davis', 'employee@university.edu', '555-0105', '1988-11-10', 'male', '789 Faculty Rd', 'Boston', 'MA', '02103', '550e8400-e29b-41d4-a716-446655440001', 'Senior Analyst', 'full-time', 'active', '2018-09-01', 68000, '[{"degree": "PhD Computer Science", "institution": "MIT"}]', 'Emily Davis', '555-0106'),
  -- Additional Employees
  ('650e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Emily', 'Wilson', 'e.wilson@university.edu', '555-0107', '1985-05-18', 'female', '321 Academic Ln', 'Boston', 'MA', '02104', '550e8400-e29b-41d4-a716-446655440001', 'Director', 'full-time', 'active', '2012-08-15', 85000, '[{"degree": "PhD Computer Science", "institution": "Stanford University"}]', 'Robert Wilson', '555-0108'),
  ('650e8400-e29b-41d4-a716-446655440005', 'EMP005', 'David', 'Brown', 'd.brown@university.edu', '555-0109', '1990-02-28', 'male', '654 Tech Blvd', 'Boston', 'MA', '02105', '550e8400-e29b-41d4-a716-446655440001', 'Lecturer', 'full-time', 'active', '2019-01-10', 62000, '[{"degree": "MS Computer Science", "institution": "Boston University"}]', 'Lisa Brown', '555-0110'),
  ('650e8400-e29b-41d4-a716-446655440006', 'EMP006', 'Jennifer', 'Martinez', 'j.martinez@university.edu', '555-0111', '1987-09-05', 'female', '987 Business Dr', 'Boston', 'MA', '02106', '550e8400-e29b-41d4-a716-446655440002', 'Team Lead', 'full-time', 'active', '2014-07-01', 78000, '[{"degree": "PhD Business Administration", "institution": "Wharton"}]', 'Carlos Martinez', '555-0112'),
  ('650e8400-e29b-41d4-a716-446655440007', 'EMP007', 'Robert', 'Garcia', 'r.garcia@university.edu', '555-0113', '1983-12-20', 'male', '147 Commerce St', 'Boston', 'MA', '02107', '550e8400-e29b-41d4-a716-446655440002', 'Director', 'full-time', 'active', '2011-09-15', 88000, '[{"degree": "PhD Economics", "institution": "Yale University"}]', 'Maria Garcia', '555-0114'),
  ('650e8400-e29b-41d4-a716-446655440008', 'EMP008', 'Linda', 'Rodriguez', 'l.rodriguez@university.edu', '555-0115', '1992-04-12', 'female', '258 Finance Way', 'Boston', 'MA', '02108', '550e8400-e29b-41d4-a716-446655440002', 'Senior Analyst', 'full-time', 'active', '2020-01-15', 65000, '[{"degree": "PhD Finance", "institution": "NYU"}]', 'Jose Rodriguez', '555-0116'),
  ('650e8400-e29b-41d4-a716-446655440009', 'EMP009', 'James', 'Lee', 'j.lee@university.edu', '555-0117', '1986-08-30', 'male', '369 Engineering Ct', 'Boston', 'MA', '02109', '550e8400-e29b-41d4-a716-446655440003', 'Director', 'full-time', 'active', '2013-06-01', 90000, '[{"degree": "PhD Mechanical Engineering", "institution": "MIT"}]', 'Susan Lee', '555-0118'),
  ('650e8400-e29b-41d4-a716-446655440010', 'EMP010', 'Mary', 'Anderson', 'm.anderson@university.edu', '555-0119', '1989-01-25', 'female', '741 Tech Plaza', 'Boston', 'MA', '02110', '550e8400-e29b-41d4-a716-446655440003', 'Team Lead', 'full-time', 'active', '2016-03-10', 76000, '[{"degree": "PhD Electrical Engineering", "institution": "Caltech"}]', 'Tom Anderson', '555-0120'),
  ('650e8400-e29b-41d4-a716-446655440011', 'EMP011', 'William', 'Taylor', 'w.taylor@university.edu', '555-0121', '1991-06-14', 'male', '852 Innovation Dr', 'Boston', 'MA', '02111', '550e8400-e29b-41d4-a716-446655440003', 'Lecturer', 'part-time', 'active', '2021-09-01', 45000, '[{"degree": "MS Civil Engineering", "institution": "Georgia Tech"}]', 'Ann Taylor', '555-0122'),
  ('650e8400-e29b-41d4-a716-446655440012', 'EMP012', 'Patricia', 'Thomas', 'p.thomas@university.edu', '555-0123', '1984-10-08', 'female', '963 Liberal Arts Ave', 'Boston', 'MA', '02112', '550e8400-e29b-41d4-a716-446655440004', 'Director', 'full-time', 'active', '2012-08-20', 82000, '[{"degree": "PhD English Literature", "institution": "Columbia"}]', 'George Thomas', '555-0124'),
  ('650e8400-e29b-41d4-a716-446655440013', 'EMP013', 'Richard', 'Jackson', 'r.jackson@university.edu', '555-0125', '1987-03-17', 'male', '159 History Ln', 'Boston', 'MA', '02113', '550e8400-e29b-41d4-a716-446655440004', 'Team Lead', 'full-time', 'active', '2015-01-12', 74000, '[{"degree": "PhD History", "institution": "Princeton"}]', 'Barbara Jackson', '555-0126'),
  ('650e8400-e29b-41d4-a716-446655440014', 'EMP014', 'Barbara', 'White', 'b.white@university.edu', '555-0127', '1993-07-29', 'female', '357 Philosophy Rd', 'Boston', 'MA', '02114', '550e8400-e29b-41d4-a716-446655440004', 'Senior Analyst', 'full-time', 'active', '2019-09-01', 63000, '[{"degree": "PhD Philosophy", "institution": "UC Berkeley"}]', 'Steven White', '555-0128'),
  ('650e8400-e29b-41d4-a716-446655440015', 'EMP015', 'Charles', 'Harris', 'c.harris@university.edu', '555-0129', '1988-11-03', 'male', '468 Support St', 'Boston', 'MA', '02115', '550e8400-e29b-41d4-a716-446655440005', 'IT Manager', 'full-time', 'active', '2016-05-15', 72000, '[{"degree": "BS Information Systems", "institution": "Northeastern"}]', 'Nancy Harris', '555-0130'),
  ('650e8400-e29b-41d4-a716-446655440016', 'EMP016', 'Susan', 'Clark', 's.clark@university.edu', '555-0131', '1990-04-19', 'female', '579 Operations Ave', 'Boston', 'MA', '02116', '550e8400-e29b-41d4-a716-446655440005', 'Operations Coordinator', 'full-time', 'active', '2018-02-20', 55000, '[{"degree": "BA Business", "institution": "Suffolk University"}]', 'Paul Clark', '555-0132'),
  ('650e8400-e29b-41d4-a716-446655440017', 'EMP017', 'Joseph', 'Lewis', 'j.lewis@university.edu', '555-0133', '1986-12-07', 'male', '680 Data Science Blvd', 'Boston', 'MA', '02117', '550e8400-e29b-41d4-a716-446655440001', 'Senior Analyst', 'full-time', 'active', '2017-08-01', 70000, '[{"degree": "PhD Data Science", "institution": "Carnegie Mellon"}]', 'Karen Lewis', '555-0134'),
  ('650e8400-e29b-41d4-a716-446655440018', 'EMP018', 'Karen', 'Walker', 'k.walker@university.edu', '555-0135', '1991-05-23', 'female', '791 AI Research Ct', 'Boston', 'MA', '02118', '550e8400-e29b-41d4-a716-446655440001', 'Research Associate', 'contract', 'active', '2022-01-10', 58000, '[{"degree": "MS Artificial Intelligence", "institution": "Stanford"}]', 'Mark Walker', '555-0136'),
  ('650e8400-e29b-41d4-a716-446655440019', 'EMP019', 'Nancy', 'Hall', 'n.hall@university.edu', '555-0137', '1985-09-16', 'female', '892 Marketing Plaza', 'Boston', 'MA', '02119', '550e8400-e29b-41d4-a716-446655440002', 'Lecturer', 'part-time', 'active', '2020-09-01', 42000, '[{"degree": "MBA Marketing", "institution": "Babson College"}]', 'Daniel Hall', '555-0138'),
  ('650e8400-e29b-41d4-a716-446655440020', 'EMP020', 'Daniel', 'Allen', 'd.allen@university.edu', '555-0139', '1989-02-11', 'male', '903 Strategy St', 'Boston', 'MA', '02120', '550e8400-e29b-41d4-a716-446655440002', 'Senior Lecturer', 'full-time', 'active', '2017-01-15', 66000, '[{"degree": "PhD Management", "institution": "Northwestern"}]', 'Rachel Allen', '555-0140'),
  ('650e8400-e29b-41d4-a716-446655440021', 'EMP021', 'Betty', 'Young', 'b.young@university.edu', '555-0141', '1992-08-26', 'female', '124 Robotics Way', 'Boston', 'MA', '02121', '550e8400-e29b-41d4-a716-446655440003', 'Senior Analyst', 'full-time', 'active', '2020-08-15', 69000, '[{"degree": "PhD Robotics", "institution": "CMU"}]', 'Frank Young', '555-0142'),
  ('650e8400-e29b-41d4-a716-446655440022', 'EMP022', 'Paul', 'King', 'p.king@university.edu', '555-0143', '1987-12-01', 'male', '235 Materials Ln', 'Boston', 'MA', '02122', '550e8400-e29b-41d4-a716-446655440003', 'Director', 'full-time', 'active', '2013-09-01', 87000, '[{"degree": "PhD Materials Science", "institution": "MIT"}]', 'Laura King', '555-0144'),
  ('650e8400-e29b-41d4-a716-446655440023', 'EMP023', 'Laura', 'Wright', 'l.wright@university.edu', '555-0145', '1990-06-18', 'female', '346 Literature Rd', 'Boston', 'MA', '02123', '550e8400-e29b-41d4-a716-446655440004', 'Lecturer', 'part-time', 'active', '2021-01-15', 40000, '[{"degree": "MA English", "institution": "Tufts"}]', 'Kevin Wright', '555-0146'),
  ('650e8400-e29b-41d4-a716-446655440024', 'EMP024', 'Kevin', 'Lopez', 'k.lopez@university.edu', '555-0147', '1988-03-09', 'male', '457 Sociology Ave', 'Boston', 'MA', '02124', '550e8400-e29b-41d4-a716-446655440004', 'Team Lead', 'full-time', 'active', '2016-08-20', 75000, '[{"degree": "PhD Sociology", "institution": "Harvard"}]', 'Michelle Lopez', '555-0148'),
  ('650e8400-e29b-41d4-a716-446655440025', 'EMP025', 'Michelle', 'Hill', 'm.hill@university.edu', '555-0149', '1991-10-13', 'female', '568 Psychology Blvd', 'Boston', 'MA', '02125', '550e8400-e29b-41d4-a716-446655440004', 'Senior Analyst', 'full-time', 'active', '2019-01-10', 67000, '[{"degree": "PhD Psychology", "institution": "UCLA"}]', 'Brian Hill', '555-0150'),
  ('650e8400-e29b-41d4-a716-446655440026', 'EMP026', 'Brian', 'Scott', 'b.scott@university.edu', '555-0151', '1986-05-27', 'male', '679 Facilities Dr', 'Boston', 'MA', '02126', '550e8400-e29b-41d4-a716-446655440005', 'Facilities Manager', 'full-time', 'active', '2015-03-15', 60000, '[{"degree": "BS Facilities Management", "institution": "UMass"}]', 'Carol Scott', '555-0152'),
  ('650e8400-e29b-41d4-a716-446655440027', 'EMP027', 'Carol', 'Green', 'c.green@university.edu', '555-0153', '1993-01-08', 'female', '780 Finance Office St', 'Boston', 'MA', '02127', '550e8400-e29b-41d4-a716-446655440005', 'Financial Analyst', 'full-time', 'active', '2020-06-01', 58000, '[{"degree": "MS Finance", "institution": "Boston College"}]', 'Eric Green', '555-0154'),
  ('650e8400-e29b-41d4-a716-446655440028', 'EMP028', 'Eric', 'Adams', 'e.adams@university.edu', '555-0155', '1989-07-21', 'male', '891 Registrar Ave', 'Boston', 'MA', '02128', '550e8400-e29b-41d4-a716-446655440005', 'Registrar Coordinator', 'full-time', 'active', '2018-08-20', 52000, '[{"degree": "BA Administration", "institution": "Emerson"}]', 'Diana Adams', '555-0156'),
  ('650e8400-e29b-41d4-a716-446655440029', 'EMP029', 'Diana', 'Baker', 'd.baker@university.edu', '555-0157', '1990-11-30', 'female', '902 Library Plaza', 'Boston', 'MA', '02129', '550e8400-e29b-41d4-a716-446655440005', 'Librarian', 'full-time', 'active', '2019-05-15', 54000, '[{"degree": "MLS Library Science", "institution": "Simmons"}]', 'Ryan Baker', '555-0158'),
  ('650e8400-e29b-41d4-a716-446655440030', 'EMP030', 'Ryan', 'Nelson', 'r.nelson@university.edu', '555-0159', '1987-04-04', 'male', '113 Student Services Rd', 'Boston', 'MA', '02130', '550e8400-e29b-41d4-a716-446655440005', 'Student Services Advisor', 'full-time', 'active', '2017-09-01', 56000, '[{"degree": "MS Counseling", "institution": "Lesley"}]', 'Jessica Nelson', '555-0160');

-- Update department heads
UPDATE public.departments SET head_id = '650e8400-e29b-41d4-a716-446655440004' WHERE id = '550e8400-e29b-41d4-a716-446655440001'; -- CS
UPDATE public.departments SET head_id = '650e8400-e29b-41d4-a716-446655440007' WHERE id = '550e8400-e29b-41d4-a716-446655440002'; -- Business
UPDATE public.departments SET head_id = '650e8400-e29b-41d4-a716-446655440009' WHERE id = '550e8400-e29b-41d4-a716-446655440003'; -- Engineering
UPDATE public.departments SET head_id = '650e8400-e29b-41d4-a716-446655440012' WHERE id = '550e8400-e29b-41d4-a716-446655440004'; -- Humanities
UPDATE public.departments SET head_id = '650e8400-e29b-41d4-a716-446655440001' WHERE id = '550e8400-e29b-41d4-a716-446655440005'; -- Administration

-- Insert Leave Balances for 2026
INSERT INTO public.leave_balances (employee_id, year, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used)
SELECT id, 2026, 20, 0, 10, 0, 10, 0 FROM public.employees;

-- Insert Sample Leave Applications
INSERT INTO public.leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status) VALUES
  ('650e8400-e29b-41d4-a716-446655440003', 'annual', '2026-02-20', '2026-02-24', 5, 'Family vacation', 'pending'),
  ('650e8400-e29b-41d4-a716-446655440004', 'sick', '2026-02-10', '2026-02-11', 2, 'Medical appointment', 'approved'),
  ('650e8400-e29b-41d4-a716-446655440005', 'casual', '2026-02-15', '2026-02-15', 1, 'Personal work', 'approved'),
  ('650e8400-e29b-41d4-a716-446655440006', 'annual', '2026-03-01', '2026-03-07', 7, 'Conference attendance', 'pending'),
  ('650e8400-e29b-41d4-a716-446655440008', 'sick', '2026-01-25', '2026-01-26', 2, 'Flu', 'rejected'),
  ('650e8400-e29b-41d4-a716-446655440009', 'annual', '2026-02-18', '2026-02-19', 2, 'Personal matters', 'pending');

-- Insert Attendance Records for the past 7 days
DO $$
DECLARE
  emp_record RECORD;
  day_offset INTEGER;
BEGIN
  FOR emp_record IN SELECT id FROM public.employees WHERE status = 'active' LOOP
    FOR day_offset IN 0..6 LOOP
      INSERT INTO public.attendance (employee_id, date, check_in, check_out, status)
      VALUES (
        emp_record.id,
        CURRENT_DATE - day_offset,
        '09:00',
        '17:00',
        'present'
      )
      ON CONFLICT (employee_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert Sample Announcements (will be created by first admin user after auth setup)
-- Note: These inserts will fail until auth users are created and linked.
-- Run these after setting up auth users:
/*
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
*/

/*
  =============================================
  DEMO USERS SETUP
  =============================================
  
  After running this migration, create the following users in Supabase Auth:
  
  1. Admin User:
     - Email: admin@university.edu
     - Password: admin123
     - app_metadata: {"role": "admin"}
  
  2. HR User:
     - Email: hr@university.edu
     - Password: hr123
     - app_metadata: {"role": "hr"}
  
  3. Employee User:
     - Email: employee@university.edu
     - Password: emp123
     - app_metadata: {"role": "employee"}
  
  Then run these SQL commands to link them:
  
  -- Get the auth user IDs and insert into users table:
  INSERT INTO public.users (id, email, role, employee_id)
  SELECT 
    au.id,
    au.email,
    CASE 
      WHEN au.email = 'admin@university.edu' THEN 'admin'
      WHEN au.email = 'hr@university.edu' THEN 'hr'
      ELSE 'employee'
    END as role,
    e.id as employee_id
  FROM auth.users au
  LEFT JOIN public.employees e ON e.email = au.email
  WHERE au.email IN ('admin@university.edu', 'hr@university.edu', 'employee@university.edu')
  ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id;
  
*/

-- =============================================
-- ENABLE REALTIME
-- =============================================

-- Set REPLICA IDENTITY to FULL for realtime tables
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.leaves REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leaves'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leaves;
    END IF;
  END IF;
END $$;

-- =============================================
-- AUTO-LINK AUTH USERS TO EMPLOYEES
-- =============================================
-- This runs automatically when auth users exist. 
-- Links users to employees and syncs emails.

-- Link auth users to employees in the users table
INSERT INTO public.users (id, email, role, employee_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_app_meta_data->>'role', 'employee') as role,
  e.id as employee_id
FROM auth.users au
LEFT JOIN public.employees e ON (
  e.email = au.email 
  OR e.first_name || '.' || LOWER(SUBSTRING(e.last_name FROM 1 FOR 1)) || '@university.edu' = LOWER(au.email)
  OR LOWER(SUBSTRING(e.first_name FROM 1 FOR 1)) || '.' || LOWER(e.last_name) || '@university.edu' = LOWER(au.email)
)
WHERE au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  employee_id = COALESCE(EXCLUDED.employee_id, public.users.employee_id),
  updated_at = now();

-- Sync employee emails to match their linked user login emails
UPDATE public.employees e
SET email = u.email
FROM public.users u
WHERE u.employee_id = e.id
  AND u.email IS NOT NULL
  AND e.email IS DISTINCT FROM u.email;

-- Create user preferences for each user
INSERT INTO public.user_preferences (user_id, email_leave_approvals, email_attendance_reminders)
SELECT id, true, true FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert announcements (only if admin user exists)
INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'Welcome to EMS 2026', 
  'The Employee Management System has been updated with new features including announcements, improved leave management, and better attendance tracking.', 
  'high', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'Office Closure Notice', 
  'The office will be closed on February 15th for maintenance. Please plan accordingly.', 
  'urgent', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, content, priority, created_by, is_active) 
SELECT 
  'New Health Benefits', 
  'We are pleased to announce improved health benefits starting March 2026. Details will be shared via email.', 
  'normal', 
  u.id, 
  true
FROM public.users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- Add activity log for system init
INSERT INTO public.activity_logs (user_id, action, entity_type, details)
SELECT id, 'System initialized with seed data', 'system', '{"version": "2.0", "date": "2026-02-14"}'::jsonb
FROM public.users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;
