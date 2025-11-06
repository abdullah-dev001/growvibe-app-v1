import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Pen from '../../assets/icons/Pen';
import Plus from '../../assets/icons/Plus';
import Trash from '../../assets/icons/Trash';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import TeacherCardSkeleton from '../../components/skeletons/TeacherCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetTeachersByBranchQuery } from '../../redux/api/teacherApi';

const teachers = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useGetTeachersByBranchQuery(branchId, {
    skip: !branchId,
    refetchOnMountOrArgChange: true,
  });

  if (teachersError) {
    Alert.alert('Error', teachersError.message || 'Failed to load teachers');
  }

  const handleEdit = (teacher) => {
    // Navigate to edit screen or open modal
  };

  const handleDelete = (teacher) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete "${teacher.full_Name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle delete logic
          }
        },
      ]
    );
  };

  const handleAddTeacher = () => {
    router.push('/screens/forms/addTeacher');
  };

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
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
              Teachers
            </Text>
            <Text style={styles.subTitle}>
              Manage school teachers
            </Text>
          </View>
          <Button
            title="Add Teacher"
            onPress={handleAddTeacher}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#F97316"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Teacher List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Teacher List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Teacher Cards */}
        <ScrollView>
          <View style={styles.scrollContent}>
            {teachersLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TeacherCardSkeleton key={index} />
              ))
            ) : teachersData && teachersData.length > 0 ? (
              teachersData.map((teacher) => (
                <View
                  key={teacher.auth_User_Id}
                  style={styles.card}
                >
                  {/* Header with Image, Name and Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar} />
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        {teacher.full_Name || 'N/A'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {teacher.email || 'No email'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: teacher.profile_Status ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(teacher.profile_Status) }
                        ]}
                      >
                        {teacher.profile_Status ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Teacher Details */}
                  <View style={styles.cardSection}>
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Contact
                      </Text>
                      <Text style={styles.cardValue}>
                        {teacher.phone || "Not assigned yet..."}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Salary
                      </Text>
                      <Text style={styles.salaryValue}>
                        {teacher.salary || 'Not assigned yet...'}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <View style={styles.cardDateRow}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        Created: {formatDate(teacher.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Primary Actions */}
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(teacher)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
                        <Text style={styles.editButtonText}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(teacher)}
                        style={[styles.deleteButton, { marginLeft: 8 }]}
                        activeOpacity={0.7}
                      >
                        <Trash size={hp(1.6)} color="#EF4444" strokeWidth={2} />
                        <Text style={styles.deleteButtonText}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No teachers found. Create your first teacher to get started.
                </Text>
                <Button
                  title="Add Teacher"
                  onPress={handleAddTeacher}
                  size="small"
                  bgColor="#F97316"
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

export default teachers;

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
    marginBottom: 12,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginRight: 12,
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
  detailItem: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(0.3),
  },
  cardValue: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  salaryValue: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Bold',
    color: '#10B981',
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
    marginLeft: hp(0.5),
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
    marginLeft: hp(0.5),
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
