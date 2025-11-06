import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import ClassCardSkeleton from '../../components/skeletons/ClassCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetClassesWithSummaryByBranchAndSessionQuery } from '../../redux/api/classApi';

const classes = () => {
  const router = useRouter();

  const { branchId, sessionId } = useSelector((state) => state.auth);

  const { data: classesData, isLoading: classesLoading, error: classesError } = useGetClassesWithSummaryByBranchAndSessionQuery({sessionId, branchId}, {
    skip: !sessionId || !branchId,
    refetchOnMountOrArgChange: true,
  });

  if (classesError) {
    Alert.alert('Error', classesError.message || 'Failed to load classes');
  }

  const handleEdit = (classItem) => {
    // Navigate to edit screen or open modal
    console.log('Edit class:', classItem);
  };

  const handleDelete = (classItem) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete ${classItem.class_Name} - Section ${classItem.class_Section}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle delete logic
            console.log('Delete class:', classItem);
          }
        },
      ]
    );
  };

  const handleLeaderboard = (classItem) => {
    // Navigate to leaderboard screen
    console.log('View leaderboard for class:', classItem);
    // router.push(`/screens/leaderboard/${classItem.id}`);
  };

  const handleAttendance = (classItem) => {
    // Navigate to attendance screen
    console.log('View attendance for class:', classItem);
    // router.push(`/screens/attendance/${classItem.id}`);
  };

  const handleResult = (classItem) => {
    // Navigate to result screen
    console.log('View results for class:', classItem);
    // router.push(`/screens/results/${classItem.id}`);
  };

  const handleStudents = (classId) => {
    // Navigate to students screen
    router.push({
      pathname: "/screens/students",
      params: {
        classId: classId,
      },
    });
  };

  const handleAddClass = () => {
    router.push('/screens/forms/addClass');
  };

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
  };

  const getStatusBgColor = (status) => {
    return status ? 'bg-green-100' : 'bg-red-100';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Classes
            </Text>
            <Text style={styles.subTitle}>
              Manage school classes
            </Text>
          </View>
          <Button
            title="Add Class"
            onPress={handleAddClass}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#1CACF3"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Class List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Class List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Class Cards */}
        <ScrollView>
          <View style={styles.scrollContent}>
            {classesLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <ClassCardSkeleton key={index} />
              ))
            ) : classesData && classesData.length > 0 ? (
              classesData.map((classItem) => (
                  <View
                    key={classItem.class_id}
                    style={styles.card}
                  >
                    {/* Header with Class Name and Status */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderContent}>
                        <Text style={styles.cardTitle}>
                          {classItem.class_Name} - Section {classItem.section}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {classItem.total_students} Students
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: classItem.class_Status ? '#D1FAE5' : '#FEE2E2' }
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(classItem.class_Status) }
                          ]}
                        >
                          {classItem.class_Status ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
    
                    {/* Class Incharge */}
                    <View style={styles.cardSection}>
                      <Text style={styles.cardLabel}>
                        Class Incharge
                      </Text>
                      <View style={styles.inchargeRow}>
                        <View style={styles.avatar} />
                        <Text style={styles.inchargeName}>
                          {classItem.incharge_name}
                        </Text>
                      </View>
                    </View>
    
                    {/* Created Date */}
                    <View style={styles.cardDateRow}>
                      <View style={styles.dateRow}>
                        <Text style={styles.dateText}>
                          Created: {formatDate(classItem.created_at)}
                        </Text>
                      </View>
                    </View>
    
                    {/* Action Buttons */}
                    <View style={styles.cardActions}>
                      {/* Primary Actions */}
                      <View style={styles.primaryActions}>
                        <TouchableOpacity
                          onPress={() => handleEdit(classItem)}
                          style={styles.actionButton}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editButtonText}>
                            Edit
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleDelete(classItem)}
                          style={[styles.deleteButton, { marginLeft: 8 }]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteButtonText}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
    
                      {/* Additional Action Buttons */}
                      <View style={styles.secondaryActions}>
                        <TouchableOpacity
                          onPress={() => handleLeaderboard(classItem)}
                          style={[styles.secondaryButton, styles.leaderboardButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.leaderboardButtonText}>
                            Leaderboard
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleAttendance(classItem)}
                          style={[styles.secondaryButton, styles.attendanceButton, { marginLeft: 8 }]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.attendanceButtonText}>
                            Attendance
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleResult(classItem)}
                          style={[styles.secondaryButton, styles.resultButton, { marginLeft: 8 }]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.resultButtonText}>
                            Result
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleStudents(classItem.class_id)}
                          style={[styles.secondaryButton, styles.studentsButton, { marginLeft: 8 }]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.studentsButtonText}>
                            Students
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No classes found. Create your first class to get started.
                </Text>
                <Button
                  title="Add Class"
                  onPress={handleAddClass}
                  size="small"
                  bgColor="#1CACF3"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default classes;

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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  listTitle: {
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  listDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 56,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: hp(0.3),
  },
  cardSubtitle: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Medium',
  },
  cardSection: {
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(0.5),
  },
  inchargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginRight: 12,
  },
  inchargeName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  cardDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  primaryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
  secondaryActions: {
    flexDirection: 'row',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaderboardButton: {
    backgroundColor: '#F3E8FF',
  },
  leaderboardButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#8B5CF6',
  },
  attendanceButton: {
    backgroundColor: '#D1FAE5',
  },
  attendanceButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
  },
  resultButton: {
    backgroundColor: '#FEF3C7',
  },
  resultButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#F59E0B',
  },
  studentsButton: {
    backgroundColor: '#EFF6FF',
  },
  studentsButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#3B82F6',
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
});