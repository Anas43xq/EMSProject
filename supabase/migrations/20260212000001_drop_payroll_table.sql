-- Drop payroll and performance_reviews tables and related policies
-- This migration removes the payroll and performance features from the database

-- Drop payroll RLS policies first
DROP POLICY IF EXISTS "Employees can view own payroll" ON payroll;
DROP POLICY IF EXISTS "Admins and HR can manage payroll" ON payroll;

-- Drop the payroll table
DROP TABLE IF EXISTS payroll CASCADE;

-- Drop payroll index if exists
DROP INDEX IF EXISTS idx_payroll_employee;

-- Drop performance_reviews RLS policies
DROP POLICY IF EXISTS "Employees can view own reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Admins and HR can manage reviews" ON performance_reviews;

-- Drop the performance_reviews table
DROP TABLE IF EXISTS performance_reviews CASCADE;
