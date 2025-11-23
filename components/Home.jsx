import { useRouter } from 'expo-router'
import React from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { hp } from '../helpers/common'
import { useGetStudentMonthlyAnalyticsQuery, useGetTeacherMonthlyAnalyticsQuery, useGetTodayAttendanceByUserQuery, useMarkOwnAttendanceMutation } from '../redux/api/attendanceApi'
import { useGetProfileByRoleQuery } from '../redux/api/profileApi'
import ImportantNotes from './ImportantNotes'
import Topbar from './Topbar'

// Teacher options configuration
const TEACHER_OPTIONS = {
  leaderboard: {
    id: "leaderboard",
    title: "Manage Leaderboard",
    description: "View and manage student leaderboard",
    link: "/screens/leaderboard",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    textColor: "text-indigo-500",
  },
  attendance: {
    id: "attendance",
    title: "Mark Attendance",
    description: "Mark student attendance daily",
    link: "/screens/attendance",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    textColor: "text-green-500",
  },
  diary: {
    id: "diary",
    title: "Diary Management",
    description: "Manage student diaries and notes",
    link: "/screens/diary",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    textColor: "text-yellow-500",
  },
  datesheet: {
    id: "datesheet",
    title: "Datesheet Management",
    description: "Create and manage exam datesheets",
    link: "/screens/datesheet",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    textColor: "text-cyan-500",
  },
  result: {
    id: "result",
    title: "Student Management",
    description: "View and manage students",
    link: "/screens/students",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    textColor: "text-teal-500",
  },
  applications: {
    id: "applications",
    title: "Applications",
    description: "Create and manage applications",
    link: "/screens/applications",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    textColor: "text-yellow-500",
  },
  tasks: {
    id: "tasks",
    title: "Tasks",
    description: "View and manage tasks",
    link: "/screens/tasks",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    textColor: "text-cyan-500",
  },
  timetableToday: {
    id: "timetableToday",
    title: "Today's Timetable",
    description: "See your classes for today",
    link: "/screens/teacherTimetable",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-500",
  },
};

// Student options configuration
const STUDENT_OPTIONS = {
  diary: {
    id: "diary",
    title: "View Diary",
    description: "View your daily diary entries",
    link: "/screens/diary",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    textColor: "text-purple-500",
  },
  leaderboard: {
    id: "leaderboard",
    title: "View Leaderboard",
    description: "View student rankings and leaderboard",
    link: "/screens/leaderboard",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-100",
    textColor: "text-pink-500",
  },
  datesheet: {
    id: "datesheet",
    title: "View Datesheet",
    description: "View exam dates and schedules",
    link: "/screens/datesheet",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-500",
  },
  applications: {
    id: "applications",
    title: "Applications",
    description: "Create and view your applications",
    link: "/screens/applications",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    textColor: "text-emerald-500",
  },
  tasks: {
    id: "tasks",
    title: "Tasks",
    description: "View tasks assigned to you",
    link: "/screens/tasks",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    textColor: "text-cyan-500",
  },
  fees: {
    id: "fees",
    title: "My Fees",
    description: "View your fee records and payment history",
    link: "/screens/studentFees",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
    textColor: "text-amber-500",
  },
  timetable: {
    id: "timetable",
    title: "Timetable",
    description: "Check your weekly schedule",
    link: "/screens/studentTimetable",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-500",
  },
};

const getBgColor = (bgClass) => {
  const colorMap = {
    "bg-indigo-50": "#EEF2FF",
    "bg-green-50": "#D1FAE5",
    "bg-yellow-50": "#FEF3C7",
    "bg-cyan-50": "#CFFAFE",
    "bg-teal-50": "#CCFBF1",
    "bg-purple-50": "#F3E8FF",
    "bg-pink-50": "#FCE7F3",
    "bg-orange-50": "#FFEDD5",
    "bg-blue-50": "#DBEAFE",
    "bg-emerald-50": "#D1FAE5",
    "bg-amber-50": "#FEF3C7",
  };
  return colorMap[bgClass] || "#F9FAFB";
};

const getBorderColor = (borderClass) => {
  const colorMap = {
    "border-indigo-100": "#E0E7FF",
    "border-green-100": "#A7F3D0",
    "border-yellow-100": "#FDE68A",
    "border-cyan-100": "#A5F3FC",
    "border-teal-100": "#99F6E4",
    "border-purple-100": "#E9D5FF",
    "border-pink-100": "#FBCFE8",
    "border-orange-100": "#FED7AA",
    "border-blue-100": "#BFDBFE",
    "border-emerald-100": "#A7F3D0",
    "border-amber-100": "#FDE68A",
  };
  return colorMap[borderClass] || "#E5E7EB";
};

const getTextColor = (textClass) => {
  const colorMap = {
    "text-indigo-500": "#6366F1",
    "text-green-500": "#10B981",
    "text-yellow-500": "#F59E0B",
    "text-cyan-500": "#06B6D4",
    "text-teal-500": "#14B8A6",
    "text-purple-500": "#A855F7",
    "text-pink-500": "#EC4899",
    "text-orange-500": "#F97316",
    "text-blue-500": "#3B82F6",
    "text-emerald-500": "#10B981",
    "text-amber-500": "#F59E0B",
  };
  return colorMap[textClass] || "#6B7280";
};

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const Home = () => {
  const router = useRouter();
  const { user, className, section, schoolId, branchId, classId } = useSelector((state) => state.auth);

  const { data: profile } = useGetProfileByRoleQuery(
    { userId: user?.id, role: user?.role },
    { skip: !user?.id || !user?.role }
  );

  const today = formatDateForInput(new Date());
  const todayDisplay = formatDateForDisplay(today);

  const shouldSkipAttendanceQuery = !user?.id || !today || !schoolId || !branchId;

  const {
    data: todayAttendance,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useGetTodayAttendanceByUserQuery(
    { userId: user?.id, date: today, school_Id: schoolId, branch_Id: branchId },
    { skip: shouldSkipAttendanceQuery }
  );

  const [markOwnAttendance, { isLoading: isMarkingAttendance }] = useMarkOwnAttendanceMutation();

  // Get current month and year for monthly analytics
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear();

  // Fetch monthly analytics for students
  const shouldSkipStudentAnalytics = !user?.id || !classId || user?.role !== 'student';
  const {
    data: studentMonthlyAnalytics,
    isLoading: isLoadingStudentAnalytics,
  } = useGetStudentMonthlyAnalyticsQuery(
    {
      p_class_id: classId,
      p_user_id: user?.id,
      p_role: 'student',
      p_month: currentMonth,
      p_year: currentYear,
    },
    { skip: shouldSkipStudentAnalytics }
  );

  // Fetch monthly analytics for teachers
  const shouldSkipTeacherAnalytics = !user?.id || user?.role !== 'teacher';
  const {
    data: teacherMonthlyAnalytics,
    isLoading: isLoadingTeacherAnalytics,
  } = useGetTeacherMonthlyAnalyticsQuery(
    {
      p_user_id: user?.id,
      p_role: 'teacher',
      p_month: currentMonth,
      p_year: currentYear,
    },
    { skip: shouldSkipTeacherAnalytics }
  );

  // Use appropriate analytics based on role
  const monthlyAnalytics = user?.role === 'student' ? studentMonthlyAnalytics : teacherMonthlyAnalytics;
  const isLoadingMonthlyAnalytics = user?.role === 'student' ? isLoadingStudentAnalytics : isLoadingTeacherAnalytics;

  const handleMarkAttendance = async (status) => {
    try {
      if (!user?.id || !schoolId || !branchId) {
        Alert.alert('Error', 'Required information is missing');
        return;
      }

      await markOwnAttendance({
        date: today,
        user_Id: user.id,
        school_Id: schoolId,
        branch_Id: branchId,
        status: status,
        role: user.role,
        marked_By: user.id,
      }).unwrap();

      refetchAttendance();
      Alert.alert('Success', `Attendance marked as ${status}`);
    } catch (error) {
      Alert.alert('Error', error?.data?.message || error?.message || 'Failed to mark attendance');
    }
  };

  const getAttendanceStatus = () => {
    if (!todayAttendance) return 'Not Marked';
    return todayAttendance.status || 'Not Marked';
  };

  const getAttendanceBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return { backgroundColor: '#10B981' };
      case 'absent':
        return { backgroundColor: '#EF4444' };
      case 'late':
        return { backgroundColor: '#F59E0B' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Topbar />
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello {profile?.full_Name || 'Student'}
        </Text>
        <Text style={styles.subtitle}>
          {user?.role === 'student' ? 'Student of' : 'Teacher of'} {className} {section}
        </Text>
      </View>
      <View style={styles.attendanceSection}>
        <View style={styles.attendanceLeft}>
          <Text style={styles.attendanceTitle}>
            Today's Attendance
          </Text>
          <Text style={styles.attendanceDate}>
            {todayDisplay}
          </Text>
        </View>
        {user?.role === 'teacher' ? (
          isLoadingAttendance ? (
            <View style={[styles.attendanceBadge, styles.loadingBadge]}>
              <Text style={styles.attendanceBadgeText}>Checking...</Text>
            </View>
          ) : todayAttendance ? (
            <View style={[styles.attendanceBadge, getAttendanceBadgeStyle(todayAttendance.status)]}>
              <Text style={styles.attendanceBadgeText}>
                {todayAttendance.status?.toUpperCase() || 'NOT MARKED'}
              </Text>
            </View>
          ) : (
            <View style={styles.teacherAttendanceButtons}>
              <TouchableOpacity
                style={[styles.attendanceButton, styles.presentButton]}
                onPress={() => handleMarkAttendance('present')}
                disabled={isMarkingAttendance}
                activeOpacity={0.7}
              >
                <Text style={styles.attendanceButtonText}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attendanceButton, styles.absentButton]}
                onPress={() => handleMarkAttendance('absent')}
                disabled={isMarkingAttendance}
                activeOpacity={0.7}
              >
                <Text style={styles.attendanceButtonText}>Absent</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={[styles.attendanceBadge, getAttendanceBadgeStyle(getAttendanceStatus())]}>
            <Text style={styles.attendanceBadgeText}>
              {getAttendanceStatus().toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      {(user?.role === 'student' || user?.role === 'teacher') && (
      <View style={styles.monthlyAttendanceSection}>
        <View>
          <Text style={styles.monthlyTitle}>
            Monthly Attendance
          </Text>
            {isLoadingMonthlyAnalytics ? (
              <View style={styles.attendanceStats}>
                <Text style={styles.loadingText}>Loading analytics...</Text>
              </View>
            ) : monthlyAnalytics ? (
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, styles.statCircleGreen]}>
                <Text style={styles.statCircleText}>
                      {monthlyAnalytics.present_percent?.toFixed(1) || 0}%
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Present
              </Text>
                  <Text style={styles.statCount}>
                    {monthlyAnalytics.present || 0}/{monthlyAnalytics.total_days || 0}
                  </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, styles.statCircleRed]}>
                <Text style={styles.statCircleText}>
                      {monthlyAnalytics.absent_percent?.toFixed(1) || 0}%
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Absent
              </Text>
                  <Text style={styles.statCount}>
                    {monthlyAnalytics.absent || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statCircle, styles.statCircleOrange]}>
                    <Text style={styles.statCircleText}>
                      {monthlyAnalytics.late_percent?.toFixed(1) || 0}%
                    </Text>
                  </View>
                  <Text style={styles.statLabel}>
                    Late
                  </Text>
                  <Text style={styles.statCount}>
                    {monthlyAnalytics.late || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statCircle, styles.statCircleBlue]}>
                    <Text style={styles.statCircleText}>
                      {monthlyAnalytics.leave_percent?.toFixed(1) || 0}%
                    </Text>
                  </View>
                  <Text style={styles.statLabel}>
                    Leave
                  </Text>
                  <Text style={styles.statCount}>
                    {monthlyAnalytics.leave || 0}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.attendanceStats}>
                <Text style={styles.emptyText}>No attendance data available</Text>
            </View>
            )}
          </View>
        </View>
      )}
      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesTitle}>
            Important Notes
          </Text>
          <Pressable onPress={() => router.push('screens/impNotesList')}>
            <Text style={styles.viewAllText}>
              View All
            </Text>
          </Pressable>
        </View>
        <ImportantNotes
          renderEmptyState={() => (
            <View style={styles.emptyNotesContainer}>
              <Text style={styles.emptyNotesTitle}>No important notes yet</Text>
              <Text style={styles.emptyNotesSubtitle}>
                Stay tuned! Notes shared by your school will appear here.
              </Text>
            </View>
          )}
        />
      </View>
      
      <View style={styles.optionsSection}>
        <Text style={styles.optionsTitle}>
          {user?.role === 'student' ? 'Student Options' : 'Management Options'}
        </Text>

        <View style={styles.optionsList}>
          {Object.values(user?.role === 'student' ? STUDENT_OPTIONS : TEACHER_OPTIONS).map((option) => (
            <Pressable
              key={option.id}
              onPress={() => router.push(option.link)}
              style={[
                styles.optionCard,
                {
                  backgroundColor: getBgColor(option.bgColor),
                  borderColor: getBorderColor(option.borderColor),
                },
              ]}
            >
              <Text
                style={[
                  styles.optionTitle,
                  { color: getTextColor(option.textColor) },
                ]}
              >
                {option.title}
              </Text>
              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  greeting: {
    fontSize: hp(3.4),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#111827',
  },
  subtitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    letterSpacing: -0.5,
    color: '#6B7280',
    marginTop: 4,
  },
  attendanceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLeft: {
    flex: 1,
  },
  attendanceTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#374151',
  },
  attendanceDate: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  presentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#10B981',
  },
  presentText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.4),
  },
  teacherAttendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  presentButton: {
    backgroundColor: '#10B981',
  },
  absentButton: {
    backgroundColor: '#EF4444',
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: hp(1.4),
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  attendanceBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.4),
  },
  loadingBadge: {
    backgroundColor: '#9CA3AF',
  },
  monthlyAttendanceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  monthlyTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#374151',
  },
  attendanceStats: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 'auto',
    marginRight: 20,
  },
  statCircle: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(6),
    width: hp(6),
  },
  statCircleGreen: {
    backgroundColor: '#10B981',
  },
  statCircleRed: {
    backgroundColor: '#EF4444',
  },
  statCircleOrange: {
    backgroundColor: '#F59E0B',
  },
  statCircleBlue: {
    backgroundColor: '#3B82F6',
  },
  statCircleText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    letterSpacing: -0.3,
    fontSize: hp(1.6),
  },
  statLabel: {
    color: '#6B7280',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    marginTop: 4,
    fontSize: hp(1.5),
  },
  statCount: {
    color: '#9CA3AF',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.2),
    marginTop: 2,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.4),
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.4),
    marginTop: 8,
  },
  notesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyNotesContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  emptyNotesTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  emptyNotesSubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: hp(2),
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#374151',
  },
  viewAllText: {
    color: '#6B7280',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    letterSpacing: -0.3,
    fontSize: hp(1.4),
  },
  optionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsList: {
    // gap handled by marginBottom in optionCard
  },
  optionCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    marginBottom: 12,
  },
  optionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontWeight: '600',
    fontSize: hp(2.2),
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});
