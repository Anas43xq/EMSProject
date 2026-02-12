/*
  # Fix All RLS Policies - Remove Infinite Recursion

  ## Problem
  Many policies and the get_user_role() function query the users table,
  causing infinite recursion when RLS is enabled.

  ## Solution
  1. Replace get_user_role() function to use JWT metadata
  2. Update all policies that directly query users table
  3. Use auth.jwt() -> 'app_metadata' -> 'role' instead

  ## Changes
  - Replace get_user_role() function
  - Update policies for: activity_logs, attendance, documents, 
    leave_balances, leaves, payroll, performance_reviews
*/

-- Replace get_user_role function to use JWT metadata
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role');
END;
$$;

-- Update activity_logs policies
DROP POLICY IF EXISTS "Admins can view all logs" ON activity_logs;
CREATE POLICY "Admins can view all logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Update attendance policies
DROP POLICY IF EXISTS "Employees can view own attendance" ON attendance;
CREATE POLICY "Employees can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

DROP POLICY IF EXISTS "HR and Admins can update attendance" ON attendance;
CREATE POLICY "HR and Admins can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr'));

-- Update documents policies
DROP POLICY IF EXISTS "Employees can view own documents" ON documents;
CREATE POLICY "Employees can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

DROP POLICY IF EXISTS "HR and Admins can manage documents" ON documents;
CREATE POLICY "HR and Admins can manage documents"
  ON documents FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr'));

-- Update leave_balances policies
DROP POLICY IF EXISTS "Employees can view own leave balances" ON leave_balances;
CREATE POLICY "Employees can view own leave balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

-- Update leaves policies
DROP POLICY IF EXISTS "Employees can view own leaves" ON leaves;
CREATE POLICY "Employees can view own leaves"
  ON leaves FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

-- Update payroll policies
DROP POLICY IF EXISTS "Employees can view own payroll" ON payroll;
CREATE POLICY "Employees can view own payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

-- Update performance_reviews policies
DROP POLICY IF EXISTS "Employees can view own reviews" ON performance_reviews;
CREATE POLICY "Employees can view own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );
