import { useTranslation } from 'react-i18next';
import { Clock, Calendar, Plus } from 'lucide-react';
import { PageSpinner, Card, EmptyState, Button } from '../../components/ui';
import { useAttendance } from './useAttendance';
import AttendanceRecordCard from './AttendanceRecordCard';
import AddAttendanceModal from './AddAttendanceModal';

export default function Attendance() {
  const { t } = useTranslation();
  const {
    attendanceRecords,
    loading,
    user,
    selectedDate,
    setSelectedDate,
    showAddModal,
    setShowAddModal,
    employees,
    formData,
    setFormData,
    submitting,
    error,
    calculateHoursWorked,
    handleMarkAttendance,
    handleCheckOut,
    openAddModal,
    handleAddAttendance,
  } = useAttendance();

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('attendance.title')}</h1>
          <p className="text-gray-600 mt-2">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role === 'employee' && isToday && (
            <Button onClick={handleMarkAttendance} icon={<Clock className="w-5 h-5" />}>
              {t('attendance.markAttendance')}
            </Button>
          )}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Button onClick={openAddModal} icon={<Plus className="w-5 h-5" />}>
              {t('attendance.addAttendance')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="flex items-center space-x-4 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-4">
          {attendanceRecords.map((record) => (
            <AttendanceRecordCard
              key={record.id}
              record={record}
              userRole={user?.role}
              isToday={isToday}
              onCheckOut={handleCheckOut}
              calculateHoursWorked={calculateHoursWorked}
            />
          ))}
        </div>

        {attendanceRecords.length === 0 && (
          <EmptyState message={t('attendance.noRecords')} />
        )}
      </Card>

      <AddAttendanceModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        onSubmit={handleAddAttendance}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
