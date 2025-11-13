import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: timetables, 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetTimetablesByClassQuery(classId, {
    skip: !classId,
  });

  // Group timetables by week
  const timetablesByWeek = useMemo(() => {
    if (!timetables || timetables.length === 0) return {};
    
    const grouped = {};
    timetables.forEach((tt) => {
      const week = tt.week_number;
      if (!grouped[week]) {
        grouped[week] = {};
      }
      // Store the entire timetable object (which contains periods array)
      grouped[week][tt.day] = tt;
    });
    return grouped;
  }, [timetables]);

  // Get available weeks (1-4) that don't have timetables
  const availableWeeks = useMemo(() => {
    const existingWeeks = Object.keys(timetablesByWeek).map(Number);
    return [1, 2, 3, 4].filter((week) => !existingWeeks.includes(week));
  }, [timetablesByWeek]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleAddTimetable = () => {
    if (availableWeeks.length === 0) {
      Alert.alert('Info', 'All weeks (1-4) already have timetables.');
      return;
    }
    setShowAddModal(true);
  };

  const handleWeekSelection = (week) => {
    setShowAddModal(false);
    router.push({
      pathname: '/screens/forms/addTimetable',
      params: {
        classId,
        className,
        schoolId,
        branchId,
        weekNumber: week.toString(),
      },
    });
  };

  const handleEditTimetable = (timetable) => {
    
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

  const renderWeekCard = ({ item: week }) => {
    const weekData = timetablesByWeek[week];
    if (!weekData) return null;

    return (
      <View style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>Week {week}</Text>
        </View>
        <View style={styles.daysContainer}>
          {daysOfWeek.map((day) => {
            const timetable = weekData[day];
            if (!timetable || !timetable.periods || timetable.periods.length === 0) return null;

            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {timetable.periods.map((period, index) => (
                  <View key={period.period_id || index} style={styles.periodCard}>
                    <Text style={styles.periodSubject}>{period.subject_Name || 'N/A'}</Text>
                    <Text style={styles.periodTime}>
                      {formatTime(period.start_Time)} - {formatTime(period.end_Time)}
                    </Text>
                    {period.teacher_name && (
                      <Text style={styles.periodTeacher}>Teacher: {period.teacher_name}</Text>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const weeks = Object.keys(timetablesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Timetable</Text>
            <Text style={styles.subTitle}>{className || 'Class Timetable'}</Text>
          </View>
          {availableWeeks.length > 0 && (
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

        {/* Timetables List */}
        {isLoading && !timetables ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading timetables...</Text>
          </View>
        ) : weeks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No timetables found. Create your first timetable to get started.</Text>
            {availableWeeks.length > 0 && (
              <Button
                title="Add Timetable"
                onPress={handleAddTimetable}
                size="small"
                bgColor="#F59E0B"
                textColor="#FFFFFF"
                icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
              />
            )}
          </View>
        ) : (
          <FlatList
            data={weeks}
            keyExtractor={(week) => String(week)}
            renderItem={renderWeekCard}
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
          />
        )}

        {/* Week Selection Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Week</Text>
              <Text style={styles.modalSubtitle}>Choose a week to create timetable for</Text>
              <ScrollView style={styles.weekOptionsContainer}>
                {availableWeeks.map((week) => (
                  <TouchableOpacity
                    key={week}
                    style={styles.weekOption}
                    onPress={() => handleWeekSelection(week)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.weekOptionText}>Week {week}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

