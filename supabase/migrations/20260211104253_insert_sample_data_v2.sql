/*
  Sample Data for Employee Management System - Version 2
  
  This migration inserts realistic sample data:
  1. 5 departments (3 academic, 2 administrative)
  2. 30 employees across departments
  3. Leave balances for all employees
  4. Sample leave applications
  5. Attendance records
  6. Payroll records for January 2026
  
  Note: User accounts and related data (performance reviews, activity logs)
  need to be created after auth users are set up
*/

-- Insert Departments
INSERT INTO departments (id, name, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Computer Science', 'academic', 'Department of Computer Science and Information Technology'),
('550e8400-e29b-41d4-a716-446655440002', 'Business Administration', 'academic', 'School of Business and Management'),
('550e8400-e29b-41d4-a716-446655440003', 'Engineering', 'academic', 'Faculty of Engineering and Technology'),
('550e8400-e29b-41d4-a716-446655440004', 'Humanities', 'academic', 'Department of Humanities and Social Sciences'),
('550e8400-e29b-41d4-a716-446655440005', 'Administration', 'administrative', 'University Administration and Support Services')
ON CONFLICT (id) DO NOTHING;

-- Insert Employees
INSERT INTO employees (id, employee_number, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, postal_code, department_id, position, employment_type, status, hire_date, salary, qualifications, emergency_contact_name, emergency_contact_phone) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'EMP001', 'John', 'Smith', 'admin@university.edu', '555-0101', '1975-03-15', 'male', '123 Admin St', 'Boston', 'MA', '02101', '550e8400-e29b-41d4-a716-446655440005', 'University Administrator', 'full-time', 'active', '2010-01-15', 95000, '[{"degree": "MBA", "institution": "Harvard University"}]', 'Jane Smith', '555-0102'),
('650e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Sarah', 'Johnson', 'hr@university.edu', '555-0103', '1982-07-22', 'female', '456 HR Ave', 'Boston', 'MA', '02102', '550e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'full-time', 'active', '2015-03-20', 75000, '[{"degree": "MS Human Resources", "institution": "Boston College"}]', 'Mike Johnson', '555-0104'),
('650e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Michael', 'Davis', 'employee@university.edu', '555-0105', '1988-11-10', 'male', '789 Faculty Rd', 'Boston', 'MA', '02103', '550e8400-e29b-41d4-a716-446655440001', 'Assistant Professor', 'full-time', 'active', '2018-09-01', 68000, '[{"degree": "PhD Computer Science", "institution": "MIT"}]', 'Emily Davis', '555-0106'),
('650e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Emily', 'Wilson', 'e.wilson@university.edu', '555-0107', '1985-05-18', 'female', '321 Academic Ln', 'Boston', 'MA', '02104', '550e8400-e29b-41d4-a716-446655440001', 'Professor', 'full-time', 'active', '2012-08-15', 85000, '[{"degree": "PhD Computer Science", "institution": "Stanford University"}]', 'Robert Wilson', '555-0108'),
('650e8400-e29b-41d4-a716-446655440005', 'EMP005', 'David', 'Brown', 'd.brown@university.edu', '555-0109', '1990-02-28', 'male', '654 Tech Blvd', 'Boston', 'MA', '02105', '550e8400-e29b-41d4-a716-446655440001', 'Lecturer', 'full-time', 'active', '2019-01-10', 62000, '[{"degree": "MS Computer Science", "institution": "Boston University"}]', 'Lisa Brown', '555-0110'),
('650e8400-e29b-41d4-a716-446655440006', 'EMP006', 'Jennifer', 'Martinez', 'j.martinez@university.edu', '555-0111', '1987-09-05', 'female', '987 Business Dr', 'Boston', 'MA', '02106', '550e8400-e29b-41d4-a716-446655440002', 'Associate Professor', 'full-time', 'active', '2014-07-01', 78000, '[{"degree": "PhD Business Administration", "institution": "Wharton"}]', 'Carlos Martinez', '555-0112'),
('650e8400-e29b-41d4-a716-446655440007', 'EMP007', 'Robert', 'Garcia', 'r.garcia@university.edu', '555-0113', '1983-12-20', 'male', '147 Commerce St', 'Boston', 'MA', '02107', '550e8400-e29b-41d4-a716-446655440002', 'Professor', 'full-time', 'active', '2011-09-15', 88000, '[{"degree": "PhD Economics", "institution": "Yale University"}]', 'Maria Garcia', '555-0114'),
('650e8400-e29b-41d4-a716-446655440008', 'EMP008', 'Linda', 'Rodriguez', 'l.rodriguez@university.edu', '555-0115', '1992-04-12', 'female', '258 Finance Way', 'Boston', 'MA', '02108', '550e8400-e29b-41d4-a716-446655440002', 'Assistant Professor', 'full-time', 'active', '2020-01-15', 65000, '[{"degree": "PhD Finance", "institution": "NYU"}]', 'Jose Rodriguez', '555-0116'),
('650e8400-e29b-41d4-a716-446655440009', 'EMP009', 'James', 'Lee', 'j.lee@university.edu', '555-0117', '1986-08-30', 'male', '369 Engineering Ct', 'Boston', 'MA', '02109', '550e8400-e29b-41d4-a716-446655440003', 'Professor', 'full-time', 'active', '2013-06-01', 90000, '[{"degree": "PhD Mechanical Engineering", "institution": "MIT"}]', 'Susan Lee', '555-0118'),
('650e8400-e29b-41d4-a716-446655440010', 'EMP010', 'Mary', 'Anderson', 'm.anderson@university.edu', '555-0119', '1989-01-25', 'female', '741 Tech Plaza', 'Boston', 'MA', '02110', '550e8400-e29b-41d4-a716-446655440003', 'Associate Professor', 'full-time', 'active', '2016-03-10', 76000, '[{"degree": "PhD Electrical Engineering", "institution": "Caltech"}]', 'Tom Anderson', '555-0120'),
('650e8400-e29b-41d4-a716-446655440011', 'EMP011', 'William', 'Taylor', 'w.taylor@university.edu', '555-0121', '1991-06-14', 'male', '852 Innovation Dr', 'Boston', 'MA', '02111', '550e8400-e29b-41d4-a716-446655440003', 'Lecturer', 'part-time', 'active', '2021-09-01', 45000, '[{"degree": "MS Civil Engineering", "institution": "Georgia Tech"}]', 'Ann Taylor', '555-0122'),
('650e8400-e29b-41d4-a716-446655440012', 'EMP012', 'Patricia', 'Thomas', 'p.thomas@university.edu', '555-0123', '1984-10-08', 'female', '963 Liberal Arts Ave', 'Boston', 'MA', '02112', '550e8400-e29b-41d4-a716-446655440004', 'Professor', 'full-time', 'active', '2012-08-20', 82000, '[{"degree": "PhD English Literature", "institution": "Columbia"}]', 'George Thomas', '555-0124'),
('650e8400-e29b-41d4-a716-446655440013', 'EMP013', 'Richard', 'Jackson', 'r.jackson@university.edu', '555-0125', '1987-03-17', 'male', '159 History Ln', 'Boston', 'MA', '02113', '550e8400-e29b-41d4-a716-446655440004', 'Associate Professor', 'full-time', 'active', '2015-01-12', 74000, '[{"degree": "PhD History", "institution": "Princeton"}]', 'Barbara Jackson', '555-0126'),
('650e8400-e29b-41d4-a716-446655440014', 'EMP014', 'Barbara', 'White', 'b.white@university.edu', '555-0127', '1993-07-29', 'female', '357 Philosophy Rd', 'Boston', 'MA', '02114', '550e8400-e29b-41d4-a716-446655440004', 'Assistant Professor', 'full-time', 'active', '2019-09-01', 63000, '[{"degree": "PhD Philosophy", "institution": "UC Berkeley"}]', 'Steven White', '555-0128'),
('650e8400-e29b-41d4-a716-446655440015', 'EMP015', 'Charles', 'Harris', 'c.harris@university.edu', '555-0129', '1988-11-03', 'male', '468 Support St', 'Boston', 'MA', '02115', '550e8400-e29b-41d4-a716-446655440005', 'IT Manager', 'full-time', 'active', '2016-05-15', 72000, '[{"degree": "BS Information Systems", "institution": "Northeastern"}]', 'Nancy Harris', '555-0130'),
('650e8400-e29b-41d4-a716-446655440016', 'EMP016', 'Susan', 'Clark', 's.clark@university.edu', '555-0131', '1990-04-19', 'female', '579 Operations Ave', 'Boston', 'MA', '02116', '550e8400-e29b-41d4-a716-446655440005', 'Operations Coordinator', 'full-time', 'active', '2018-02-20', 55000, '[{"degree": "BA Business", "institution": "Suffolk University"}]', 'Paul Clark', '555-0132'),
('650e8400-e29b-41d4-a716-446655440017', 'EMP017', 'Joseph', 'Lewis', 'j.lewis@university.edu', '555-0133', '1986-12-07', 'male', '680 Data Science Blvd', 'Boston', 'MA', '02117', '550e8400-e29b-41d4-a716-446655440001', 'Assistant Professor', 'full-time', 'active', '2017-08-01', 70000, '[{"degree": "PhD Data Science", "institution": "Carnegie Mellon"}]', 'Karen Lewis', '555-0134'),
('650e8400-e29b-41d4-a716-446655440018', 'EMP018', 'Karen', 'Walker', 'k.walker@university.edu', '555-0135', '1991-05-23', 'female', '791 AI Research Ct', 'Boston', 'MA', '02118', '550e8400-e29b-41d4-a716-446655440001', 'Research Associate', 'contract', 'active', '2022-01-10', 58000, '[{"degree": "MS Artificial Intelligence", "institution": "Stanford"}]', 'Mark Walker', '555-0136'),
('650e8400-e29b-41d4-a716-446655440019', 'EMP019', 'Nancy', 'Hall', 'n.hall@university.edu', '555-0137', '1985-09-16', 'female', '892 Marketing Plaza', 'Boston', 'MA', '02119', '550e8400-e29b-41d4-a716-446655440002', 'Lecturer', 'part-time', 'active', '2020-09-01', 42000, '[{"degree": "MBA Marketing", "institution": "Babson College"}]', 'Daniel Hall', '555-0138'),
('650e8400-e29b-41d4-a716-446655440020', 'EMP020', 'Daniel', 'Allen', 'd.allen@university.edu', '555-0139', '1989-02-11', 'male', '903 Strategy St', 'Boston', 'MA', '02120', '550e8400-e29b-41d4-a716-446655440002', 'Senior Lecturer', 'full-time', 'active', '2017-01-15', 66000, '[{"degree": "PhD Management", "institution": "Northwestern"}]', 'Rachel Allen', '555-0140'),
('650e8400-e29b-41d4-a716-446655440021', 'EMP021', 'Betty', 'Young', 'b.young@university.edu', '555-0141', '1992-08-26', 'female', '124 Robotics Way', 'Boston', 'MA', '02121', '550e8400-e29b-41d4-a716-446655440003', 'Assistant Professor', 'full-time', 'active', '2020-08-15', 69000, '[{"degree": "PhD Robotics", "institution": "CMU"}]', 'Frank Young', '555-0142'),
('650e8400-e29b-41d4-a716-446655440022', 'EMP022', 'Paul', 'King', 'p.king@university.edu', '555-0143', '1987-12-01', 'male', '235 Materials Ln', 'Boston', 'MA', '02122', '550e8400-e29b-41d4-a716-446655440003', 'Professor', 'full-time', 'active', '2013-09-01', 87000, '[{"degree": "PhD Materials Science", "institution": "MIT"}]', 'Laura King', '555-0144'),
('650e8400-e29b-41d4-a716-446655440023', 'EMP023', 'Laura', 'Wright', 'l.wright@university.edu', '555-0145', '1990-06-18', 'female', '346 Literature Rd', 'Boston', 'MA', '02123', '550e8400-e29b-41d4-a716-446655440004', 'Lecturer', 'part-time', 'active', '2021-01-15', 40000, '[{"degree": "MA English", "institution": "Tufts"}]', 'Kevin Wright', '555-0146'),
('650e8400-e29b-41d4-a716-446655440024', 'EMP024', 'Kevin', 'Lopez', 'k.lopez@university.edu', '555-0147', '1988-03-09', 'male', '457 Sociology Ave', 'Boston', 'MA', '02124', '550e8400-e29b-41d4-a716-446655440004', 'Associate Professor', 'full-time', 'active', '2016-08-20', 75000, '[{"degree": "PhD Sociology", "institution": "Harvard"}]', 'Michelle Lopez', '555-0148'),
('650e8400-e29b-41d4-a716-446655440025', 'EMP025', 'Michelle', 'Hill', 'm.hill@university.edu', '555-0149', '1991-10-13', 'female', '568 Psychology Blvd', 'Boston', 'MA', '02125', '550e8400-e29b-41d4-a716-446655440004', 'Assistant Professor', 'full-time', 'active', '2019-01-10', 67000, '[{"degree": "PhD Psychology", "institution": "UCLA"}]', 'Brian Hill', '555-0150'),
('650e8400-e29b-41d4-a716-446655440026', 'EMP026', 'Brian', 'Scott', 'b.scott@university.edu', '555-0151', '1986-05-27', 'male', '679 Facilities Dr', 'Boston', 'MA', '02126', '550e8400-e29b-41d4-a716-446655440005', 'Facilities Manager', 'full-time', 'active', '2015-03-15', 60000, '[{"degree": "BS Facilities Management", "institution": "UMass"}]', 'Carol Scott', '555-0152'),
('650e8400-e29b-41d4-a716-446655440027', 'EMP027', 'Carol', 'Green', 'c.green@university.edu', '555-0153', '1993-01-08', 'female', '780 Finance Office St', 'Boston', 'MA', '02127', '550e8400-e29b-41d4-a716-446655440005', 'Financial Analyst', 'full-time', 'active', '2020-06-01', 58000, '[{"degree": "MS Finance", "institution": "Boston College"}]', 'Eric Green', '555-0154'),
('650e8400-e29b-41d4-a716-446655440028', 'EMP028', 'Eric', 'Adams', 'e.adams@university.edu', '555-0155', '1989-07-21', 'male', '891 Registrar Ave', 'Boston', 'MA', '02128', '550e8400-e29b-41d4-a716-446655440005', 'Registrar Coordinator', 'full-time', 'active', '2018-08-20', 52000, '[{"degree": "BA Administration", "institution": "Emerson"}]', 'Diana Adams', '555-0156'),
('650e8400-e29b-41d4-a716-446655440029', 'EMP029', 'Diana', 'Baker', 'd.baker@university.edu', '555-0157', '1990-11-30', 'female', '902 Library Plaza', 'Boston', 'MA', '02129', '550e8400-e29b-41d4-a716-446655440005', 'Librarian', 'full-time', 'active', '2019-05-15', 54000, '[{"degree": "MLS Library Science", "institution": "Simmons"}]', 'Ryan Baker', '555-0158'),
('650e8400-e29b-41d4-a716-446655440030', 'EMP030', 'Ryan', 'Nelson', 'r.nelson@university.edu', '555-0159', '1987-04-04', 'male', '113 Student Services Rd', 'Boston', 'MA', '02130', '550e8400-e29b-41d4-a716-446655440005', 'Student Services Advisor', 'full-time', 'active', '2017-09-01', 56000, '[{"degree": "MS Counseling", "institution": "Lesley"}]', 'Jessica Nelson', '555-0160')
ON CONFLICT (id) DO NOTHING;

-- Insert Leave Balances for current year
INSERT INTO leave_balances (employee_id, year, annual_total, annual_used, sick_total, sick_used, casual_total, casual_used)
SELECT id, 2026, 20, 0, 10, 0, 10, 0
FROM employees
ON CONFLICT (employee_id, year) DO NOTHING;

-- Insert Sample Leave Applications
INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days_count, reason, status) VALUES
('650e8400-e29b-41d4-a716-446655440003', 'annual', '2026-02-20', '2026-02-24', 5, 'Family vacation', 'pending'),
('650e8400-e29b-41d4-a716-446655440004', 'sick', '2026-02-10', '2026-02-11', 2, 'Medical appointment', 'approved'),
('650e8400-e29b-41d4-a716-446655440005', 'casual', '2026-02-15', '2026-02-15', 1, 'Personal work', 'approved'),
('650e8400-e29b-41d4-a716-446655440006', 'annual', '2026-03-01', '2026-03-07', 7, 'Conference attendance', 'pending'),
('650e8400-e29b-41d4-a716-446655440008', 'sick', '2026-01-25', '2026-01-26', 2, 'Flu', 'rejected'),
('650e8400-e29b-41d4-a716-446655440009', 'annual', '2026-02-18', '2026-02-19', 2, 'Personal matters', 'pending')
ON CONFLICT DO NOTHING;

-- Insert Sample Attendance Records for the past week
DO $$
DECLARE
  emp_record RECORD;
  day_offset INTEGER;
BEGIN
  FOR emp_record IN SELECT id FROM employees WHERE status = 'active' LOOP
    FOR day_offset IN 0..6 LOOP
      INSERT INTO attendance (employee_id, date, check_in, check_out, status)
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

-- Insert Sample Payroll Records for January 2026
INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, gross_salary, net_salary, status)
SELECT 
  id,
  1,
  2026,
  salary,
  jsonb_build_object('housing', salary * 0.2, 'transport', 500),
  jsonb_build_object('tax', salary * 0.15, 'insurance', 200),
  salary * 1.2 + 500,
  salary * 1.2 + 500 - (salary * 0.15 + 200),
  'paid'
FROM employees
WHERE status = 'active'
ON CONFLICT (employee_id, month, year) DO NOTHING;