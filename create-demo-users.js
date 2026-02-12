import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoUsers = [
  {
    email: 'admin@university.edu',
    password: 'admin123',
    role: 'admin',
    employeeId: '650e8400-e29b-41d4-a716-446655440001'
  },
  {
    email: 'hr@university.edu',
    password: 'hr123',
    role: 'hr',
    employeeId: '650e8400-e29b-41d4-a716-446655440002'
  },
  {
    email: 'employee@university.edu',
    password: 'emp123',
    role: 'employee',
    employeeId: '650e8400-e29b-41d4-a716-446655440003'
  }
];

async function createDemoUsers() {
  console.log('Creating demo user accounts...\n');

  for (const user of demoUsers) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        app_metadata: {
          role: user.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✓ User ${user.email} already exists`);

          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const existingAuthUser = existingUser?.users.find(u => u.email === user.email);

          if (existingAuthUser) {
            // Update auth user metadata
            await supabase.auth.admin.updateUserById(existingAuthUser.id, {
              app_metadata: { role: user.role }
            });

            const { error: dbError } = await supabase
              .from('users')
              .upsert({
                id: existingAuthUser.id,
                email: user.email,
                role: user.role,
                employee_id: user.employeeId
              });

            if (!dbError) {
              console.log(`  → Linked to users table with role: ${user.role}\n`);
            }
          }
        } else {
          console.error(`✗ Error creating ${user.email}:`, authError.message);
        }
        continue;
      }

      console.log(`✓ Created auth user: ${user.email}`);
      console.log(`  User ID: ${authData.user.id}`);

      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: user.email,
          role: user.role,
          employee_id: user.employeeId
        });

      if (dbError) {
        console.error(`✗ Error linking ${user.email} to users table:`, dbError.message);
      } else {
        console.log(`  → Linked to users table with role: ${user.role}`);
        console.log(`  → Linked to employee: ${user.employeeId}\n`);
      }
    } catch (error) {
      console.error(`✗ Unexpected error for ${user.email}:`, error.message);
    }
  }

  console.log('\n=== Demo Users Summary ===');
  console.log('Admin: admin@university.edu / admin123');
  console.log('HR: hr@university.edu / hr123');
  console.log('Employee: employee@university.edu / emp123');
  console.log('\nYou can now log in with any of these accounts!');
}

createDemoUsers()
  .then(() => {
    console.log('\nSetup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSetup failed:', error);
    process.exit(1);
  });
