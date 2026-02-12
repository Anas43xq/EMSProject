import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationContainer from './components/NotificationContainer';

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeView = lazy(() => import('./pages/EmployeeView'));
const EmployeeEdit = lazy(() => import('./pages/EmployeeEdit'));
const Departments = lazy(() => import('./pages/Departments'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <NotificationContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="employees" element={<Suspense fallback={<PageLoader />}><Employees /></Suspense>} />
              <Route path="employees/:id" element={<Suspense fallback={<PageLoader />}><EmployeeView /></Suspense>} />
              <Route path="employees/:id/edit" element={<Suspense fallback={<PageLoader />}><EmployeeEdit /></Suspense>} />
              <Route path="departments" element={<Suspense fallback={<PageLoader />}><Departments /></Suspense>} />
              <Route path="attendance" element={<Suspense fallback={<PageLoader />}><Attendance /></Suspense>} />
              <Route path="leaves" element={<Suspense fallback={<PageLoader />}><Leaves /></Suspense>} />
              <Route path="performance" element={<Suspense fallback={<PageLoader />}><Performance /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
