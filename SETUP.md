# Setup Instructions

## Creating Demo User Accounts

The database has been populated with sample data, but the demo user accounts need to be created through Supabase Auth. Follow these steps:

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create the following accounts:

**Admin Account**
- Email: `admin@university.edu`
- Password: `admin123`
- After creation, note the User ID

**HR Account**
- Email: `hr@university.edu`
- Password: `hr123`
- After creation, note the User ID

**Employee Account**
- Email: `employee@university.edu`
- Password: `emp123`
- After creation, note the User ID

4. After creating each user, run this SQL in the Supabase SQL Editor to link them to the users table:

```sql
-- Replace the UUIDs with the actual user IDs from step 3
INSERT INTO users (id, email, role, employee_id) VALUES
('YOUR_ADMIN_USER_ID', 'admin@university.edu', 'admin', '650e8400-e29b-41d4-a716-446655440001'),
('YOUR_HR_USER_ID', 'hr@university.edu', 'hr', '650e8400-e29b-41d4-a716-446655440002'),
('YOUR_EMPLOYEE_USER_ID', 'employee@university.edu', 'employee', '650e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  employee_id = EXCLUDED.employee_id;
```

### Option 2: Using Supabase API

You can also create users programmatically using the Supabase Admin API. Here's a Node.js script example:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key
);

async function createDemoUsers() {
  const users = [
    { email: 'admin@university.edu', password: 'admin123', role: 'admin', employeeId: '650e8400-e29b-41d4-a716-446655440001' },
    { email: 'hr@university.edu', password: 'hr123', role: 'hr', employeeId: '650e8400-e29b-41d4-a716-446655440002' },
    { email: 'employee@university.edu', password: 'emp123', role: 'employee', employeeId: '650e8400-e29b-41d4-a716-446655440003' },
  ];

  for (const user of users) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    });

    if (authError) {
      console.error(`Error creating ${user.email}:`, authError);
      continue;
    }

    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: user.email,
        role: user.role,
        employee_id: user.employeeId
      });

    if (dbError) {
      console.error(`Error linking ${user.email}:`, dbError);
    } else {
      console.log(`Created and linked ${user.email}`);
    }
  }
}

createDemoUsers();
```

## Verifying Setup

After creating the users, verify the setup by:

1. Opening the application
2. Logging in with each demo account
3. Verifying that the correct role and permissions are displayed
4. Testing basic functionality (viewing employees, applying for leave, etc.)

## Troubleshooting

### Users can't log in
- Verify users were created in Supabase Auth dashboard
- Check that users table has matching records
- Ensure the user IDs match between auth.users and the users table

### Wrong permissions
- Check the role field in the users table
- Verify the employee_id is correctly linked
- Check RLS policies are enabled on all tables

### Missing data
- Run the sample data migrations again if needed
- Verify all migrations completed successfully
- Check Supabase logs for any errors

## Production Deployment

For production use:

1. Change all demo passwords to secure passwords
2. Set up proper email confirmation flows
3. Configure password reset functionality
4. Set up proper backup procedures
5. Enable Supabase email templates
6. Configure proper logging and monitoring
7. Review and adjust RLS policies for your specific needs
