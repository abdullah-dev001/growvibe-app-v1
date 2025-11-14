import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { useGetTimetablesByClassQuery } from '../../redux/api/timetableApi';

const timetable = () => {
  const router = useRouter();
  const { classId, className } = useLocalSearchParams();
  const { schoolId, branchId } = useSelector((state) => state.auth);
  const [selectedWeek, setSelectedWeek] = useState(1); // Default to Week 1
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: timetables, 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetTimetablesByClassQuery(
    { classId, weekNumber: selectedWeek },
    {
      skip: !classId,
    }
  );

  // Group timetables by day for the selected week
  const timetablesByDay = useMemo(() => {
    if (!timetables || timetables.length === 0) return {};
    
    const grouped = {};
    timetables.forEach((tt) => {
      // Store the entire timetable object (which contains periods array)
      grouped[tt.day] = tt;
    });
    return grouped;
  }, [timetables]);

  // Check if the selected week has a timetable
  const hasTimetableForWeek = useMemo(() => {
    return timetables && timetables.length > 0;
  }, [timetables]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleAddTimetable = () => {
    router.push({
      pathname: '/screens/forms/addTimetable',
      params: {
        classId,
        className,
        schoolId,
        branchId,
        weekNumber: selectedWeek.toString(),
      },
    });
  };

  const handleWeekChange = (week) => {
    setSelectedWeek(week);
  };

  const handleEditTimetable = (timetable) => {
    router.push({
      pathname: '/screens/forms/addTimetable',
      params: {
        timetableId: timetable.timetable_id,
        classId,
        className,
        schoolId,
        branchId,
        weekNumber: timetable.week_number.toString(),
      },
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // Assuming time is in HH:MM:SS format
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

  const renderTimetableContent = () => {
    return (
      <View style={styles.weekCard}>
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day) => {
            const timetable = timetablesByDay[day];
            const hasTimetable = timetable && timetable.periods && timetable.periods.length > 0;

            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  {hasTimetable ? (
                    <TouchableOpacity
                      onPress={() => handleEditTimetable(timetable)}
                      style={styles.editButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/screens/forms/addTimetable',
                          params: {
                            classId,
                            className,
                            schoolId,
                            branchId,
                            weekNumber: selectedWeek.toString(),
                            selectedDay: day,
                          },
                        });
                      }}
                      style={styles.addButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {hasTimetable ? (
                  timetable.periods.map((period, index) => (
                    <View key={period.period_id || index} style={styles.periodCard}>
                      <Text style={styles.periodSubject}>{period.subject_Name || 'N/A'}</Text>
                      <Text style={styles.periodTime}>
                        {formatTime(period.start_Time)} - {formatTime(period.end_Time)}
                      </Text>
                      {period.teacher_name && (
                        <Text style={styles.periodTeacher}>Teacher: {period.teacher_name}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.noTimetableContainer}>
                    <Text style={styles.noTimetableText}>No timetable for this day</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Timetable</Text>
            <Text style={styles.subTitle}>{className || 'Class Timetable'}</Text>
          </View>
          {!isFetching && !hasTimetableForWeek && (
            <Button
              title="Add Timetable"
              onPress={handleAddTimetable}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#F59E0B"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Week Selector */}
        <View style={styles.weekSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekSelectorContent}
          >
            {[1, 2, 3, 4].map((week) => {
              const isSelected = selectedWeek === week;
              return (
                <TouchableOpacity
                  key={week}
                  onPress={() => handleWeekChange(week)}
                  style={[
                    styles.weekSelectorButton,
                    isSelected ? styles.weekSelectorButtonActive : styles.weekSelectorButtonInactive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.weekSelectorText,
                      { color: isSelected ? '#F59E0B' : '#6B7280' },
                    ]}
                  >
                    Week {week}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Timetables List */}
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
              <Text style={styles.loadingText}>Loading timetables...</Text>
            </View>
          ) : !hasTimetableForWeek ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No timetable found for Week {selectedWeek}. Create a timetable to get started.
              </Text>
            </View>
          ) : (
            renderTimetableContent()
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default timetable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  scrollContent: {
    paddingBottom: 56,
  },
  weekSelectorContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  weekSelectorContent: {
    paddingHorizontal: 4,
  },
  weekSelectorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 12,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekSelectorButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  weekSelectorButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  weekSelectorText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
  },
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#F59E0B',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#10B981',
  },
  noTimetableContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 8,
  },
  noTimetableText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  periodCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
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
    marginBottom: 4,
  },
  periodTeacher: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 20,
  },
  weekOptionsContainer: {
    maxHeight: 300,
  },
  weekOption: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  weekOptionText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#F59E0B',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});

