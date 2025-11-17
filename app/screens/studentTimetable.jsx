import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { useGetTimetablesByClassQuery } from '../../redux/api/timetableApi';

const StudentTimetable = () => {
  const { classId, className } = useSelector((state) => state.auth);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: timetables,
    isLoading,
    isFetching,
    refetch,
  } = useGetTimetablesByClassQuery(
    { classId, weekNumber: selectedWeek },
    { skip: !classId }
  );

  const timetablesByDay = useMemo(() => {
    if (!timetables || timetables.length === 0) return {};
    const grouped = {};
    timetables.forEach((tt) => {
      grouped[tt.day] = tt;
    });
    return grouped;
  }, [timetables]);

  const hasTimetableForWeek = useMemo(() => {
    return timetables && timetables.length > 0;
  }, [timetables]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  if (!classId) {
    return (
      <ScreenWrapper>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Timetable not available</Text>
          <Text style={styles.fallbackSubtitle}>
            Your class information is missing. Please contact your school administrator.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Class Timetable</Text>
          <Text style={styles.subTitle}>{className || 'Class'} | Week {selectedWeek}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekSelectorContent}
        >
          {[1, 2, 3, 4].map((week) => {
            const isSelected = selectedWeek === week;
            return (
              <View
                key={week}
                style={[
                  styles.weekButton,
                  isSelected ? styles.weekButtonActive : styles.weekButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.weekButtonText,
                    { color: isSelected ? '#F59E0B' : '#6B7280' },
                  ]}
                  onPress={() => setSelectedWeek(week)}
                >
                  Week {week}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
          {isLoading && !timetables ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading timetable...</Text>
            </View>
          ) : !hasTimetableForWeek ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No timetable yet</Text>
              <Text style={styles.emptySubtitle}>
                Your school hasn't published a timetable for Week {selectedWeek}.
              </Text>
            </View>
          ) : (
            daysOfWeek.map((day) => {
              const timetable = timetablesByDay[day];
              const hasTimetable = timetable && timetable.periods && timetable.periods.length > 0;

              return (
                <View key={day} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{day}</Text>
                  </View>
                  {hasTimetable ? (
                    timetable.periods.map((period, index) => (
                      <View key={period.period_id || index} style={styles.periodCard}>
                        <Text style={styles.periodSubject}>{period.subject_Name || 'Subject'}</Text>
                        <Text style={styles.periodTime}>
                          {formatTime(period.start_Time)} - {formatTime(period.end_Time)}
                        </Text>
                        {period.teacher_name && (
                          <Text style={styles.periodTeacher}>Teacher: {period.teacher_name}</Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.noPeriodContainer}>
                      <Text style={styles.noPeriodText}>No classes scheduled</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default StudentTimetable;

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
  weekSelectorContent: {
    marginBottom: hp(2),
    gap: 8,
  },
  weekButton: {
    minWidth: 72,
    height: hp(5),
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: hp(1),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
  },
  scrollContent: {
    paddingBottom: 48,
    paddingTop: hp(2),
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
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dayHeader: {
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
  },
  periodCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  periodSubject: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  periodTime: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  periodTeacher: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  noPeriodContainer: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  noPeriodText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2),
  },
});

