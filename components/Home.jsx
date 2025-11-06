import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { hp } from '../helpers/common'
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
    link: "/screens/mark-attendance",
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
    title: "Result Management",
    description: "Manage and publish student results",
    link: "/screens/result",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    textColor: "text-teal-500",
  },
};

const getBgColor = (bgClass) => {
  const colorMap = {
    "bg-indigo-50": "#EEF2FF",
    "bg-green-50": "#D1FAE5",
    "bg-yellow-50": "#FEF3C7",
    "bg-cyan-50": "#CFFAFE",
    "bg-teal-50": "#CCFBF1",
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
  };
  return colorMap[textClass] || "#6B7280";
};

const Home = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container}>
      <Topbar />
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello John Doe
        </Text>
        <Text style={styles.subtitle}>
          Student of Class 10A
        </Text>
      </View>
      <View style={styles.attendanceSection}>
        <View style={styles.attendanceLeft}>
          <Text style={styles.attendanceTitle}>
            Today's Attendance
          </Text>
          <Text style={styles.attendanceDate}>
            Nov 02, 2025
          </Text>
        </View>
        <View style={styles.presentBadge}>
          <Text style={styles.presentText}>
            Present
          </Text>
        </View>
      </View>
      <View style={styles.monthlyAttendanceSection}>
        <View>
          <Text style={styles.monthlyTitle}>
            Monthly Attendence
          </Text>
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, styles.statCircleGreen]}>
                <Text style={styles.statCircleText}>
                  90%
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Present
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, styles.statCircleRed]}>
                <Text style={styles.statCircleText}>
                  10%
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Absent
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesTitle}>
            Principal Notes
          </Text>
          <Pressable>
            <Text style={styles.viewAllText}>
              View All
            </Text>
          </Pressable>
        </View>
      </View>
      
      {user?.role === "teacher" && (
        <View style={styles.teacherOptions}>
          <Text style={styles.teacherOptionsTitle}>
            Management Options
          </Text>

          <View style={styles.teacherOptionsList}>
            {Object.values(TEACHER_OPTIONS).map((option) => (
              <Pressable
                key={option.id}
                onPress={() => router.push(option.link)}
                style={[
                  styles.teacherOptionCard,
                  {
                    backgroundColor: getBgColor(option.bgColor),
                    borderColor: getBorderColor(option.borderColor),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.teacherOptionTitle,
                    { color: getTextColor(option.textColor) },
                  ]}
                >
                  {option.title}
                </Text>
                <Text style={styles.teacherOptionDescription}>
                  {option.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
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
  notesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  teacherOptions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  teacherOptionsTitle: {
    fontSize: hp(2),
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: hp(1.5),
  },
  teacherOptionsList: {
    // gap handled by marginBottom in teacherOptionCard
  },
  teacherOptionCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    marginBottom: 12,
  },
  teacherOptionTitle: {
    fontFamily: "Poppins-Bold",
    fontWeight: '700',
    fontSize: hp(2.2),
  },
  teacherOptionDescription: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});
