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
- **Styling**: Tailwind CSS with custom `@apply` utility classes
- **UI Components**: Custom reusable component library (`src/components/ui/`)
- **State Management**: React Context + custom hooks (`useFormModal`, `useActivityLogger`)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Internationalization**: react-i18next with RTL support
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime for notifications
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
- **DRY Architecture**: Reusable UI components, shared hooks, and centralized types eliminate code duplication
- **Modular Pages**: Complex pages split into index, hook, types, and sub-components for maintainability
- **Type Safety**: Full TypeScript implementation with shared type definitions
- **Security First**: Row Level Security, role-based access, and proper authentication

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Core UI component library
│   │   ├── index.ts     # Barrel exports
│   │   ├── PageSpinner.tsx   # Loading spinner
│   │   ├── PageHeader.tsx    # Page title with subtitle & action
│   │   ├── Card.tsx          # Card container with hover variant
│   │   ├── Button.tsx        # Button (primary/secondary/danger/ghost)
│   │   ├── Modal.tsx         # Compound modal (Header/Body/Footer)
│   │   ├── StatusBadge.tsx   # Status badges with color mapping
│   │   ├── EmptyState.tsx    # Empty state with icon/action
│   │   ├── FormField.tsx     # Form label wrapper
│   │   └── FormError.tsx     # Error alert display
│   ├── Login.tsx            # Authentication page
│   ├── Layout.tsx           # Main layout with sidebar
│   ├── NotificationCenter.tsx
│   ├── NotificationContainer.tsx
│   ├── AnnouncementsWidget.tsx
│   └── ProtectedRoute.tsx   # Route protection wrapper
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state management
│   └── NotificationContext.tsx
├── hooks/                # Reusable custom hooks
│   ├── index.ts          # Barrel exports
│   ├── useFormModal.ts   # Generic form modal state management
│   └── useActivityLogger.ts  # Activity logging with user context
├── i18n/                 # Internationalization
│   ├── index.ts          # i18n configuration
│   ├── en.json           # English translations
│   └── ar.json           # Arabic translations
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client configuration
│   ├── database.types.ts # TypeScript database types
│   ├── types.ts          # Shared Employee/Department types
│   ├── queries.ts        # Shared Supabase queries
│   ├── activityLog.ts    # Activity logging utility
│   ├── notifications.ts  # Notification helpers
│   ├── dbNotifications.ts
│   └── dashboardConfig.ts
├── pages/                # Main application pages (modular structure)
│   ├── Dashboard/
│   │   ├── index.tsx
│   │   ├── useDashboard.ts
│   │   ├── StatCards.tsx
│   │   ├── DepartmentChart.tsx
│   │   ├── LeaveChart.tsx
│   │   ├── RecentActivities.tsx
│   │   └── QuickActions.tsx
│   ├── Leaves/
│   │   ├── index.tsx
│   │   ├── useLeaves.ts
│   │   ├── types.ts
│   │   ├── ApplyLeaveModal.tsx
│   │   ├── LeaveCard.tsx
│   │   └── LeaveStatusFilter.tsx
│   ├── Attendance/
│   │   ├── index.tsx
│   │   ├── useAttendance.ts
│   │   ├── types.ts
│   │   ├── AddAttendanceModal.tsx
│   │   └── AttendanceTable.tsx
│   ├── Departments/
│   │   ├── index.tsx
│   │   ├── useDepartments.ts
│   │   ├── types.ts
│   │   ├── DepartmentCard.tsx
│   │   └── DepartmentFormModal.tsx
│   ├── Announcements/
│   │   ├── index.tsx
│   │   ├── useAnnouncements.ts
│   │   ├── types.ts
│   │   ├── AnnouncementCard.tsx
│   │   └── AnnouncementFormModal.tsx
│   ├── UserManagement/
│   │   ├── index.tsx
│   │   ├── useUserManagement.ts
│   │   ├── types.ts
│   │   ├── UserStatsCards.tsx
│   │   ├── UserFilters.tsx
│   │   ├── UsersTable.tsx
│   │   ├── AddUserModal.tsx
│   │   ├── EditUserModal.tsx
│   │   ├── LinkEmployeeModal.tsx
│   │   ├── DeleteUserModal.tsx
│   │   └── ResetPasswordModal.tsx
│   ├── Reports/
│   │   ├── index.tsx
│   │   ├── useReports.ts
│   │   ├── ReportCardGrid.tsx
│   │   └── CustomReportPanel.tsx
│   ├── Settings/
│   │   ├── index.tsx
│   │   ├── ProfileInfoCard.tsx
│   │   ├── ChangePasswordCard.tsx
│   │   ├── NotificationPrefsCard.tsx
│   │   ├── LanguageCard.tsx
│   │   └── AccountInfoSidebar.tsx
│   ├── EmployeeEdit/
│   │   ├── index.tsx
│   │   ├── useEmployeeEdit.ts
│   │   ├── PersonalInfoSection.tsx
│   │   ├── EmploymentDetailsSection.tsx
│   │   └── EmergencyContactSection.tsx
│   ├── Employees.tsx
│   ├── EmployeeView.tsx
│   ├── Profile.tsx
│   └── ResetPassword.tsx
└── App.tsx               # Main app component with routing
```

## UI Component Library

The project includes a reusable UI component library (`src/components/ui/`) to reduce code duplication:

| Component | Description |
|-----------|-------------|
| `PageSpinner` | Centered loading spinner for page-level loading states |
| `PageHeader` | Consistent page title, subtitle, and action button layout |
| `Card` | Standard card container with optional hover effect |
| `Button` | Variants: primary, secondary, danger, ghost with loading state |
| `Modal` | Compound component with Modal.Header, Modal.Body, Modal.Footer |
| `StatusBadge` | Color-coded status badges (16 status types supported) |
| `EmptyState` | Empty state display with icon, title, message, and action |
| `FormField` | Form label wrapper with required indicator |
| `FormError` | Conditional error alert display |

### Usage Example

```tsx
import { PageSpinner, PageHeader, Card, Button, EmptyState } from '../components/ui';

// Loading state
if (loading) return <PageSpinner />;

// Page layout
<PageHeader
  title="Dashboard"
  subtitle="Welcome back"
  action={<Button icon={<Plus />}>Add New</Button>}
/>

// Cards
<Card hover>Content here</Card>

// Empty states
<EmptyState
  icon={<Inbox className="w-16 h-16" />}
  title="No items"
  message="Get started by creating one"
  action={<Button>Create</Button>}
/>
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
