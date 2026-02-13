# Employee Management System (EMS)

A comprehensive, production-ready Employee Management System with role-based access control, complete HR functionality, and modern UI/UX.

## Features

### Core Modules

1. **Dashboard & Analytics**
   - Real-time statistics for employees, departments, and activities
   - Quick action cards for common tasks
   - Recent activity feed
   - Visual overview of system metrics

2. **Employee Management**
   - Complete employee directory with advanced search and filtering
   - Detailed employee profiles with personal and professional information
   - Employment history and qualifications tracking
   - Support for different employment types (full-time, part-time, contract)
   - Status management (active, inactive, on-leave)

3. **Department Management**
   - Academic and administrative department categorization
   - Department head assignment
   - Employee allocation tracking
   - Department-wise statistics

4. **Leave Management**
   - Multiple leave types (annual, sick, casual, sabbatical)
   - Leave balance tracking per employee
   - Approval workflow (employee → HR/Admin)
   - Leave calendar and history
   - Status tracking (pending, approved, rejected)
   - Email notifications for approvals/rejections

5. **Attendance Tracking**
   - Employee self-service check-in and check-out
   - Daily attendance marking with check-in/check-out times
   - Multiple status types (present, absent, late, half-day)
   - Automatic hours worked calculation
   - Historical attendance records
   - Date-based filtering
   - HR/Admin can add attendance records for any employee

8. **Reports & Analytics**
   - Pre-built report templates for all modules
   - Custom report generation
   - CSV export format
   - Department-wise filtering
   - Date range selection

9. **User Settings**
   - Profile management
   - Password change functionality
   - Notification preferences
   - Language preference (English/Arabic)
   - Role-based UI customization

10. **Multi-Language Support**
    - Full English and Arabic translations
    - Right-to-Left (RTL) layout support for Arabic
    - Language switcher in header and settings
    - Automatic language detection from browser
    - Persistent language preference (localStorage)

### User Roles & Permissions

#### Admin
- Full system access
- Employee management (create, edit, delete)
- Department management
- Leave approval/rejection
- System settings
- All reports access
- User management

#### HR
- Employee management
- Department management
- Leave approval/rejection
- Attendance management
- Reports generation
- Announcements

#### Employee
- View own profile (My Profile page)
- Apply for leave
- Check-in and check-out attendance
- View notifications
- Update personal settings

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Internationalization**: react-i18next with RTL support
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite

## Database Schema

The system uses a comprehensive PostgreSQL database with the following tables:

- `users` - User authentication and roles
- `departments` - Academic and administrative departments
- `employees` - Complete employee information
- `leaves` - Leave applications and approvals
- `leave_balances` - Annual leave balance tracking
- `attendance` - Daily attendance records
- `notifications` - System notifications
- `activity_logs` - Audit trail

All tables implement Row Level Security (RLS) for data protection.

## Demo Accounts

The system comes with three pre-configured demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@university.edu | admin123 | Full system access |
| HR | hr@university.edu | hr123 | HR operations |
| Employee | employee@university.edu | emp123 | Personal data only |

## Sample Data

The system includes realistic sample data:
- 5 departments (3 academic, 2 administrative)
- 30 employees across different departments and positions
- Leave applications with various statuses
- Attendance records for the past week

## Design Principles

- **Professional University Aesthetic**: Navy blue color scheme suitable for academic institutions
- **Mobile Responsive**: Fully responsive design works on all device sizes
- **Accessibility**: High contrast ratios and proper semantic HTML
- **Clean Architecture**: Modular component structure with clear separation of concerns
- **Type Safety**: Full TypeScript implementation for better code quality
- **Security First**: Row Level Security, role-based access, and proper authentication

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Login.tsx       # Authentication page
│   ├── Layout.tsx      # Main layout with sidebar
│   └── ProtectedRoute.tsx  # Route protection wrapper
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── i18n/              # Internationalization
│   ├── index.ts       # i18n configuration
│   ├── en.json        # English translations
│   └── ar.json        # Arabic translations
├── lib/               # Utility libraries
│   ├── supabase.ts    # Supabase client configuration
│   └── database.types.ts  # TypeScript database types
├── pages/             # Main application pages
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── EmployeeView.tsx
│   ├── EmployeeEdit.tsx
│   ├── Profile.tsx     # Employee self-service profile view
│   ├── Departments.tsx
│   ├── Leaves.tsx
│   ├── Attendance.tsx
│   ├── Announcements.tsx
│   ├── Reports.tsx
│   ├── UserManagement.tsx
│   ├── Settings.tsx
│   └── ResetPassword.tsx
└── App.tsx            # Main app component with routing
```

## Getting Started

The application is already configured and ready to use. Simply:

1. The development server runs automatically
2. Navigate to the application in your browser
3. Log in with one of the demo accounts
4. Explore the different modules based on your role

## Security Features

- Email/password authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- Role-based access control
- Protected routes based on user roles
- Secure password handling
- Activity logging for audit trails

## Deployment

The project includes a `vercel.json` configuration for easy deployment to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy

The SPA routing is pre-configured to work correctly on Vercel.

## License

This is a demonstration project for university employee management systems.
