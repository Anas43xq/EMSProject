# Employee Management System (EMS) - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Setup & Installation](#setup--installation)
4. [Database Schema](#database-schema)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Features](#features)
7. [API Documentation](#api-documentation)
8. [Authentication Flow](#authentication-flow)
9. [Key Components](#key-components)
10. [Email Notifications](#email-notifications)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Employee Management System (EMS)** is a comprehensive web application for managing employee information, attendance, leave requests, departments, and announcements in an organization.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling**: Tailwind CSS
- **Internationalization**: i18next (English & Arabic)
- **State Management**: React Context API
- **Real-time**: Supabase Realtime subscriptions

### Key Features
- ✅ Role-based access control (Admin, HR, Employee)
- ✅ Employee management with personal information
- ✅ Leave request system with approval workflow
- ✅ Attendance tracking with check-in/check-out
- ✅ Department management
- ✅ Announcements and notifications
- ✅ Activity logging and audit trail
- ✅ Bilingual support (English/Arabic)
- ✅ Real-time notifications
- ✅ Email notifications for leave approvals

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  - Pages: Dashboard, Employees, Leaves, Attendance, etc.    │
│  - Components: Layout, ProtectedRoute, NotificationCenter   │
│  - Contexts: AuthContext, NotificationContext               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Supabase Backend                        │
├─────────────────────────────────────────────────────────────┤
│  Auth Layer:                                                 │
│  - OAuth 2.0 via Supabase Auth                              │
│  - JWT token management                                     │
│  - Email/Password authentication                            │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (PostgreSQL):                                │
│  - Users, Employees, Departments, Leaves, Attendance        │
│  - Notifications, Announcements, Activity Logs              │
│  - Row Level Security (RLS) policies                         │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions:                                             │
│  - send-notification-email: Sends email via nodemailer      │
├─────────────────────────────────────────────────────────────┤
│  Real-time:                                                  │
│  - Supabase Realtime for live updates                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- GitHub account (optional, for version control)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anas43xq/EMSProject.git
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local` file**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ENVIRONMENT=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

### Supabase Setup

1. **Initialize Supabase locally**
   ```bash
   supabase init
   supabase start
   ```

2. **Link to remote project**
   ```bash
   supabase link --project-ref your_project_id
   ```

3. **Create auth users** (in Supabase Dashboard)
   - Admin: `admin@university.edu` / `admin123`
   - HR: `hr@university.edu` / `hr123`
   - Employee: `employee@university.edu` / `emp123`

4. **Deploy migration**
   ```bash
   supabase db push
   ```

---

## Database Schema

### Core Tables

#### 1. **users** (Public Users Table)
Linked to Supabase Auth, stores custom user data.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'employee')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- **Single Source of Truth**: `users.email` is authoritative; `employees.email` syncs automatically
- **Automatic Sync**: Triggers keep employee emails in sync with user login emails

#### 2. **employees** (Employee Information)
Stores personal and employment information.

```sql
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,  -- Auto-synced from users.email
  phone TEXT DEFAULT '',
  date_of_birth DATE,
  gender TEXT,
  address TEXT, city TEXT, state TEXT, postal_code TEXT,
  department_id UUID REFERENCES public.departments(id),
  position TEXT NOT NULL,
  employment_type TEXT DEFAULT 'full-time',
  status TEXT DEFAULT 'active',
  hire_date DATE NOT NULL,
  termination_date DATE,
  salary NUMERIC(12,2),
  qualifications JSONB,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

#### 3. **leaves** (Leave Requests)
Manages leave applications and approvals.

```sql
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'sabbatical')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

**Key Features:**
- Leave type validation (annual, sick, casual, sabbatical)
- Approval tracking with approver ID and timestamp
- Optional rejection reason

#### 4. **leave_balances** (Annual Leave Tracking)
Tracks leave quota per employee per year.

```sql
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE(employee_id, year),
  year INTEGER NOT NULL,
  annual_total INTEGER DEFAULT 20,
  annual_used INTEGER DEFAULT 0,
  sick_total INTEGER DEFAULT 10,
  sick_used INTEGER DEFAULT 0,
  casual_total INTEGER DEFAULT 10,
  casual_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

#### 5. **attendance** (Daily Attendance)
Tracks daily check-in/check-out records.

```sql
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  UNIQUE(employee_id, date)
);
```

**Key Features:**
- Duplicate prevention via UNIQUE constraint on (employee_id, date)
- Prevents multiple check-ins on same day

#### 6. **departments** (Department Information)
Organizational structure.

```sql
CREATE TABLE public.departments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academic', 'administrative')),
  head_id UUID REFERENCES public.employees(id),
  description TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

#### 7. **announcements** (Company Announcements)
Company-wide news and updates.

```sql
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

#### 8. **notifications** (In-App Notifications)
Real-time user notifications.

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave', 'attendance', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 9. **activity_logs** (Audit Trail)
Tracks all user actions.

```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ
);
```

#### 10. **user_preferences** (User Settings)
Notification preferences per user.

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_leave_approvals BOOLEAN DEFAULT true,
  email_attendance_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);
```

---

## User Roles & Permissions

### Three-Tier Role System

#### 1. **Admin**
Full system access.

| Feature | Permission |
|---------|-----------|
| Employees | Create, Read, Update, Delete |
| Departments | Create, Read, Update, Delete |
| Leaves | View All, Approve/Reject |
| Attendance | View All, Add/Edit/Delete Records |
| Announcements | Create, Edit, Delete |
| Users | Create, Edit, Delete |
| Reports | Full Access |
| Settings | Full Access |

#### 2. **HR**
Department and employee management, leave approvals.

| Feature | Permission |
|---------|-----------|
| Employees | Create, Read, Update |
| Departments | Read, Create, Update |
| Leaves | View All, Approve/Reject |
| Attendance | View All, Add/Edit Records |
| Announcements | Create, Edit |
| Reports | Full Access |
| Settings | Partial Access |

#### 3. **Employee**
Own data and leave/attendance submission.

| Feature | Permission |
|---------|-----------|
| Employees | Read (All), View Own Details |
| Leaves | Create (Own), View (Own + All if Approver) |
| Attendance | Mark Own Check-in/out |
| Announcements | Read Only |
| Settings | Own Preferences Only |

### Row Level Security (RLS) Policies

All tables have RLS enabled. Example policies:

```sql
-- Employees: Anyone can read, Admin/HR can write
CREATE POLICY "employees_select_all" ON public.employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "employees_update_admin_hr" ON public.employees
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'hr'));

-- Leaves: Employee sees own, Admin/HR see all
CREATE POLICY "leaves_select_own_or_admin_hr" ON public.leaves
  FOR SELECT TO authenticated
  USING (
    employee_id = get_user_employee_id()
    OR get_user_role() IN ('admin', 'hr')
  );
```

---

## Features

### 1. Employee Management
- **View all employees** in a table with filtering and sorting
- **Add new employees** (Admin/HR only)
- **Edit employee information** (Admin/HR only)
- **View employee details** and activity history
- **Filter by department** and employment status

### 2. Leave Management
- **Apply for leave** with reason and date range
- **View pending/approved/rejected leaves**
- **Approve/reject** leave requests (Admin/HR only)
- **Track leave balance** (annual, sick, casual)
- **Email notifications** when leave is approved/rejected
- **Leave history** with approver information

### 3. Attendance System
- **Mark daily check-in** with automatic timestamp
- **Mark check-out** at end of day
- **View attendance records** by date range
- **Prevent duplicate check-ins** on same day
- **Admin can add/edit** attendance records for employees

### 4. Department Management
- **View all departments** and their heads
- **Create departments** (Admin/HR only)
- **Update department info** (Admin/HR only)
- **View employees by department**

### 5. Announcements
- **Create company announcements** (Admin/HR only)
- **Set priority** and expiration
- **View active announcements** on dashboard
- **Mark announcements as inactive** without deleting

### 6. Notifications
- **In-app notifications** for leave status changes
- **Email notifications** for important events
- **Read/unread status** tracking
- **Dismiss notifications** individually

### 7. Dashboard
- **Quick stats**: Total employees, departments, pending leaves
- **Charts**: Employees by department, leave status distribution
- **Recent activities** audit log
- **Quick actions**: Add employee, apply leave, mark attendance

### 8. User Management
- **View all users** (Admin only)
- **Assign roles** to users (Admin only)
- **Link users to employees** (Admin only)
- **Activity tracking** per user

### 9. Reports
- **Attendance reports** with monthly summaries
- **Leave reports** with approval rates
- **Employee reports** with departmental breakdown
- **Export reports** (future feature)

### 10. Settings
- **Personal profile** management
- **Notification preferences** per user
- **Password change** capability
- **Language selection** (English/Arabic)

---

## API Documentation

### Authentication

All API requests require:
- **Authorization Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type**: `application/json`

### Base URL
```
https://[project-id].supabase.co/rest/v1
```

### Employee Endpoints

#### GET `/employees`
Fetch all employees.
- **Query Parameters**:
  - `department_id`: Filter by department UUID
  - `status`: Filter by status (active, inactive, on-leave)
  - `order`: Sort field (hire_date, last_name)

#### POST `/employees`
Create new employee (Admin/HR only).
- **Body**: Employee object with all fields
- **Returns**: Created employee with ID

#### GET `/employees/{id}`
Fetch specific employee.
- **Returns**: Employee object with department details

#### PATCH `/employees/{id}`
Update employee (Admin/HR only).
- **Body**: Partial employee object
- **Returns**: Updated employee

#### DELETE `/employees/{id}`
Delete employee (Admin only).
- **Returns**: Success status

### Leave Endpoints

#### GET `/leaves`
Fetch leaves (filtered by role).
- **Query Parameters**:
  - `status`: pending, approved, rejected
  - `employee_id`: Filter by employee
  - `date`: Filter by date range

#### POST `/leaves`
Create leave request (own or admin).
- **Body**: Leave object
- **Returns**: Created leave with ID

#### PATCH `/leaves/{id}`
Update leave status (Admin/HR only).
- **Body**: { status: 'approved'|'rejected', rejection_reason?: string }
- **Returns**: Updated leave

#### GET `/leaves/{id}/balance`
Get leave balance for employee.
- **Returns**: Balance object for current year

### Attendance Endpoints

#### GET `/attendance`
Fetch attendance records.
- **Query Parameters**:
  - `date`: Specific date or date range
  - `employee_id`: Filter by employee

#### POST `/attendance`
Mark check-in.
- **Body**: { employee_id, date, check_in, status }
- **Returns**: Created attendance record

#### PATCH `/attendance/{id}`
Update check-out.
- **Body**: { check_out: time }
- **Returns**: Updated attendance

### Notification Endpoints

#### GET `/notifications`
Fetch user's notifications.
- **Query Parameters**:
  - `is_read`: Filter by read status

#### PATCH `/notifications/{id}`
Mark notification as read.
- **Body**: { is_read: true }
- **Returns**: Updated notification

#### DELETE `/notifications/{id}`
Delete notification.
- **Returns**: Success status

---

## Authentication Flow

### Sign-In Flow

```
┌─────────────────┐
│  User enters    │
│ email/password  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Call auth.signInWithPassword()   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Supabase Auth validates          │
│ credentials against auth.users   │
└────────┬────────────────────────┘
         │
    ┌────┴──────────────────┐
    │ Success               │ Failure
    ▼                       ▼
┌──────────────────┐   Show error
│ Return JWT token │   message
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Fetch public.users record          │
│ (get role & employee_id)           │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Save to AuthContext:               │
│ - user_id, email, role, employee_id│
│ - token & session                  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Redirect to /dashboard             │
│ (ProtectedRoute checks role)       │
└────────────────────────────────────┘
```

### Auto-Setup on Auth User Creation

When a new user signs up via Supabase Auth:

```
┌──────────────────────────┐
│ New auth user created    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Trigger: on_auth_user_created    │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 1. Create public.users record    │
│ 2. Match email to employee       │
│ 3. Link if match found           │
│ 4. Sync employee email           │
│ 5. Create user_preferences       │
└──────────────────────────────────┘
```

#### Email Sync Logic

**Single Source of Truth**: `users.email` (login email)

```sql
-- Trigger fires on: INSERT or UPDATE employee_id
-- Result: employee.email = users.email

CREATE TRIGGER sync_employee_email_on_user_link
  AFTER UPDATE OF employee_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_email_on_link();
```

---

## Key Components

### Frontend Structure

```
src/
├── components/
│   ├── Layout.tsx                 # Main sidebar layout
│   ├── ProtectedRoute.tsx         # Role-based route protection
│   ├── Login.tsx                  # Auth login form
│   ├── NotificationCenter.tsx     # Real-time notifications
│   ├── NotificationContainer.tsx  # Notification toast display
│   ├── AnnouncementsWidget.tsx    # Dashboard announcements
│   └── ui/                        # Reusable UI components
├── pages/
│   ├── Dashboard.tsx              # Main dashboard
│   ├── Employees.tsx              # Employee list
│   ├── EmployeeView.tsx           # Employee details
│   ├── EmployeeEdit.tsx           # Add/edit employee
│   ├── Leaves.tsx                 # Leave management
│   ├── Attendance.tsx             # Attendance tracking
│   ├── Departments.tsx            # Department management
│   ├── Announcements.tsx          # Announcements
│   ├── Reports.tsx                # Reporting
│   ├── UserManagement.tsx         # User management
│   ├── Profile.tsx                # User profile
│   └── Settings.tsx               # User settings
├── contexts/
│   ├── AuthContext.tsx            # Auth state & functions
│   └── NotificationContext.tsx    # Notification state
├── lib/
│   ├── supabase.ts                # Supabase client
│   ├── notifications.ts           # Notification functions
│   ├── database.types.ts          # TypeScript types
│   ├── dbNotifications.ts         # DB notification queries
│   ├── activityLog.ts             # Activity logging
│   └── dashboardConfig.ts         # Dashboard config
├── i18n/
│   ├── en.json                    # English translations
│   └── ar.json                    # Arabic translations
└── hooks/                         # Custom React hooks
```

### Context: AuthContext

Manages authentication state and operations.

```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

### Context: NotificationContext

Manages in-app notifications.

```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
}

const showNotification = (type: string, message: string, title?: string) => {
  // Shows toast notification
};
```

---

## Email Notifications

### Setup

1. **Configure Email Environment Variables**
   - `GMAIL_USER`: Gmail address for sending
   - `GMAIL_PASSWORD`: Gmail app password (not regular password)

2. **Create `.env.local` in `supabase/functions/send-notification-email`**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password
   ```

### Send Email Function

Located at: `supabase/functions/send-notification-email/index.ts`

```typescript
// Triggered by leave approval/rejection
const sendNotificationEmail = async (to: string, subject: string, html: string) => {
  // Uses nodemailer to send via Gmail SMTP
};
```

### Usage Example

When a leave is approved:

```typescript
// In useLeaves.ts
const handleApprove = async (leave_id) => {
  // 1. Get user's email from users table (source of truth)
  const user_email = await getLoginEmail();
  
  // 2. Create notification in DB
  await createNotification(...);
  
  // 3. Send email notification
  await supabase.functions.invoke('send-notification-email', {
    body: {
      to: user_email,
      subject: 'Leave Approved',
      html: `Your leave has been approved...`,
    }
  });
};
```

### Email Sync Guarantee

The migration includes triggers that **automatically sync** user login email to employee record:

```sql
-- When leave is approved, email is sent to:
SELECT u.email FROM public.users u
WHERE u.employee_id = :employee_id;

-- This email ALWAYS matches u.email (login email)
-- Never uses employees.email (which auto-syncs)
```

---

## Deployment

### Deploy to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Click "New Project"
   - Import your GitHub repo
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://[id].supabase.co
     VITE_SUPABASE_ANON_KEY=your_key
     ```

3. **Deploy**
   - Vercel will automatically build and deploy on push

### Deploy to Supabase

1. **Push migrations**
   ```bash
   supabase db push
   ```

2. **Deploy edge functions**
   ```bash
   supabase functions deploy send-notification-email
   ```

### Environment Variables

**Production (.env.production)**
```env
VITE_SUPABASE_URL=https://[prod-id].supabase.co
VITE_SUPABASE_ANON_KEY=prod_key
VITE_ENVIRONMENT=production
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. **409 Conflict Error on Check-In**
**Problem**: User getting 409 when trying to check in twice.

**Solution**: 
- Check if already checked in today (database constraint)
- UI now shows "Already checked in today" message
- To check in again, admin must delete previous record

```sql
-- Check for existing record
SELECT * FROM public.attendance 
WHERE employee_id = 'user-id' AND date = TODAY;
```

#### 2. **Email Not Syncing to Employee Profile**
**Problem**: Profile still shows old email after user email change.

**Solution**:
- Migration triggers auto-sync employee email
- If not synced, manually run:
  ```sql
  UPDATE public.employees e
  SET email = u.email
  FROM public.users u
  WHERE u.employee_id = e.id AND u.email IS NOT NULL;
  ```

#### 3. **"Already Checked In" But Need to Redo**
**Problem**: User accidentally checked in early, cannot update.

**Solution** (Admin only):
- Delete the attendance record
- User can check in again
  ```sql
  DELETE FROM public.attendance 
  WHERE id = 'record-id' AND date = TODAY;
  ```

#### 4. **Email Notifications Not Sending**
**Problem**: Leave approval email not received.

**Checklist**:
1. ✅ Gmail credentials configured in Supabase secrets
2. ✅ Gmail Two-Factor enabled + app password created
3. ✅ User has email_leave_approvals = true in preferences
4. ✅ User email matches login email (check users table)
5. ✅ Edge function deployed: `supabase functions deploy`

```bash
# Check logs
supabase functions logs send-notification-email
```

#### 5. **Leave Balance Not Updating**
**Problem**: Used days not decremented.

**Solution**:
- Ensure record exists in leave_balances for current year
- Manually create if missing:
  ```sql
  INSERT INTO public.leave_balances (employee_id, year, annual_total)
  VALUES ('emp-id', 2026, 20)
  ON CONFLICT DO NOTHING;
  ```

#### 6. **RLS Policy Blocking Access**
**Problem**: "You don't have permission" error.

**Checks**:
1. User has valid JWT token
2. User role matches policy requirements
3. Policy written correctly (check `get_user_role()` function)

```bash
# Enable RLS debugging
SET log_min_messages = DEBUG;
```

#### 7. **Login Returns "Invalid Credentials"**
**Problem**: Cannot sign in despite correct password.

**Solutions**:
1. Reset password from login page
2. Verify user exists in Supabase Auth dashboard
3. Check if email is verified
4. Verify user exists in public.users table

```sql
SELECT * FROM auth.users WHERE email = 'user@example.com';
SELECT * FROM public.users WHERE email = 'user@example.com';
```

#### 8. **Attendance Record Not Saving**
**Problem**: Check-in marked as successful but not appearing.

**Solutions**:
1. Check for UNIQUE constraint violation (same date/employee)
2. Verify RLS policy allows insert
3. Check browser console for error details

```sql
-- Check recent records
SELECT * FROM public.attendance 
WHERE employee_id = 'user-id'
ORDER BY created_at DESC LIMIT 5;
```

#### 9. **i18n Not Switching Languages**
**Problem**: Arabic/English toggle not working.

**Solutions**:
1. Ensure i18n/ar.json and en.json exist
2. Check if language key exists in translation file
3. Restart dev server: `npm run dev`

#### 10. **Real-time Notifications Not Working**
**Problem**: New data not appearing without refresh.

**Solutions**:
1. Verify Supabase Realtime enabled in project settings
2. Check browser WebSocket connection (DevTools > Network)
3. Ensure subscription uses correct table name
4. Verify table has REPLICA IDENTITY FULL

```sql
-- Check replica identity
SELECT relreplident FROM pg_class 
WHERE relname = 'leaves';
-- Should show 'f' (FULL)
```

---

## Support & Contact

For issues, questions, or contributions:
- **GitHub Issues**: [Project Repository](https://github.com/Anas43xq/EMSProject)
- **Email**: Contact project maintainer
- **Documentation Updates**: Submit PR with docs changes

---

## License

This project is licensed under the MIT License.

---

## Version History

- **v2.0** (Feb 14, 2026): Email sync overhaul, auto-user setup, role-specific portal titles
- **v1.0** (Feb 12, 2026): Initial release with core EMS features

---

**Last Updated**: February 14, 2026
