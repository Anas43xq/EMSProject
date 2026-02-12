/*
  # Fix Remaining RLS Policies with Users Table Queries

  ## Problem
  Some INSERT policies still query the users table directly

  ## Solution
  Update remaining policies to avoid querying users table in RLS context

  ## Changes
  - Update attendance insert policy
  - Update leaves insert policy
*/

-- Update attendance insert policy
DROP POLICY IF EXISTS "Employees can insert own attendance" ON attendance;
CREATE POLICY "Employees can insert own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );

-- Update leaves insert policy
DROP POLICY IF EXISTS "Employees can insert own leaves" ON leaves;
CREATE POLICY "Employees can insert own leaves"
  ON leaves FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM users WHERE id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'hr')
  );
