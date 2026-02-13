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

5. **Attendance Tracking**
   - Daily attendance marking with check-in/check-out times
   - Multiple status types (present, absent, late, half-day)
   - Historical attendance records
   - Date-based filtering

6. **Performance Management**
   - Annual performance reviews
   - 5-point rating system
   - Goal tracking and achievement documentation
   - Areas of improvement identification
   - Review status management (draft, submitted, completed)

7. **Payroll Integration**
   - Monthly salary management
   - Allowances and deductions tracking
   - Gross and net salary calculations
   - Payslip generation capability
   - Payment status tracking

8. **Reports & Analytics**
   - Pre-built report templates for all modules
   - Custom report generation
   - Multiple export formats (PDF, Excel, CSV)
   - Department-wise filtering
   - Date range selection

9. **User Settings**
   - Profile management
   - Password change functionality
   - Notification preferences
   - Role-based UI customization

### User Roles & Permissions

#### Admin
- Full system access
- Employee management (create, edit, delete)
- Department management
- Leave approval/rejection
- Performance review access
- Payroll management
- System settings
- All reports access

#### HR
- Employee management
- Department management
- Leave approval/rejection
- Attendance management
- Performance review management
- Payroll access
- Reports generation

#### Employee
- View own profile
- Apply for leave
- Mark attendance
- View own performance reviews
- View own payslips
- Update personal settings

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
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
- Performance reviews
- Payroll records for January 2026

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
├── lib/               # Utility libraries
│   ├── supabase.ts    # Supabase client configuration
│   └── database.types.ts  # TypeScript database types
├── pages/             # Main application pages
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Departments.tsx
│   ├── Leaves.tsx
│   ├── Attendance.tsx
│   ├── Performance.tsx
│   ├── Payroll.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
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

## Future Enhancements

Potential areas for expansion:
- Email notifications for leave approvals
- Biometric integration for attendance
- Advanced analytics and charts
- Multi-language support
- Mobile app version
- Calendar integration
- Employee self-service portal enhancements

## License

This is a demonstration project for university employee management systems.
