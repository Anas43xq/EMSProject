-- Drop payroll table and related policies
-- This migration removes the payroll feature from the database

-- Drop RLS policies first
DROP POLICY IF EXISTS "Employees can view own payroll" ON payroll;
DROP POLICY IF EXISTS "Admins and HR can manage payroll" ON payroll;

-- Drop the payroll table
DROP TABLE IF EXISTS payroll CASCADE;

-- Remove payroll index if exists
DROP INDEX IF EXISTS idx_payroll_employee;
