import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { useGetTeacherPeriodsQuery } from '../../redux/api/timetableApi';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getCurrentDayName = () => {
  const jsDay = new Date().getDay();
  // JS getDay starts Sunday=0
  if (jsDay === 0) {
    return 'Sunday';
  }
  return daysOfWeek[jsDay - 1] || 'Monday';
};

const getCurrentWeekNumber = () => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  return Math.min(4, Math.max(1, Math.ceil(dayOfMonth / 7)));
};

const TeacherTimetable = () => {
  const { user, schoolId } = useSelector((state) => state.auth);
  const teacherId = user?.id;
  const [selectedDay, setSelectedDay] = useState(getCurrentDayName());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekNumber());
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: periods,
    isFetching,
    refetch,
  } = useGetTeacherPeriodsQuery(
    {
      teacherId,
      weekNumber: String(selectedWeek),
      day: selectedDay,
      schoolId,
    },
    { skip: !teacherId || !schoolId }
  );

  const normalizedPeriods = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    return [...periods]
      .map((period) => {
        const subjectName = period.subject_name || period.subject_Name || 'Subject';
        const startTime = period.start_time || period.start_Time || '';
        const endTime = period.end_time || period.end_Time || '';
        const className =
          period.class_name ||
          period.class_Name ||
          (period.class_id || period.class_Id ? `Class ${period.class_id || period.class_Id}` : 'Class');
        const section =
          period.section ||
          period.class_section ||
          period.section_name ||
          '';

        return {
          ...period,
          subjectName,
          startTime,
          endTime,
          className,
          section,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [periods]);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Timetable</Text>
          <Text style={styles.subTitle}>
            Week {selectedWeek} · {selectedDay}
          </Text>
        </View>

        <View style={styles.weekSelector}>
          {[1, 2, 3, 4].map((week) => {
            const isSelected = selectedWeek === week;
            return (
              <TouchableOpacity
                key={week}
                onPress={() => setSelectedWeek(week)}
                style={[
                  styles.weekButton,
                  isSelected ? styles.weekButtonActive : styles.weekButtonInactive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.weekButtonText,
                    { color: isSelected ? '#F59E0B' : '#6B7280' },
                  ]}
                >
                  Week {week}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayButton,
                  isSelected ? styles.dayButtonActive : styles.dayButtonInactive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { color: isSelected ? '#111827' : '#6B7280' },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ height: "100%" }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isFetching}
              onRefresh={handleRefresh}
              colors={['#F59E0B']}
              tintColor="#F59E0B"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {!teacherId ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Teacher profile missing</Text>
              <Text style={styles.emptySubtitle}>
                Please log in again or contact support if the issue persists.
              </Text>
            </View>
          ) : isFetching && !periods ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : normalizedPeriods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No periods scheduled</Text>
              <Text style={styles.emptySubtitle}>
                You have no classes assigned for {selectedDay} in Week {selectedWeek}.
              </Text>
            </View>
          ) : (
            normalizedPeriods.map((period, index) => (
              <View key={period.period_id || index} style={styles.periodCard}>
                <View style={styles.periodHeader}>
                  <Text style={styles.periodSubject}>{period.subjectName}</Text>
                  <Text style={styles.periodTime}>
                    {formatTime(period.startTime)} - {formatTime(period.endTime)}
                  </Text>
                </View>
                <Text style={styles.periodClass}>
                  {period.className}
                  {period.section ? ` · ${period.section}` : ''}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default TeacherTimetable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subTitle: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  weekSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  weekButton: {
    flex: 1,
    minHeight: hp(3.6),
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: hp(1),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  weekButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  weekButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
  },
  daySelector: {
    paddingVertical: 8,
    gap: 8,
    marginBottom: hp(1),
  },
  dayButton: {
    minWidth: 90,
    height: hp(5),
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: hp(1),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#818CF8',
  },
  dayButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dayButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
  },
  scrollContent: {
    paddingVertical: 16,
    height: "100%",
    paddingBottom: 48,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingVertical: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodTime: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#F59E0B',
  },
  periodClass: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  periodSubject: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  periodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodMeta: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2),
  },
});

