import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import ClassCardSkeleton from '../../components/skeletons/ClassCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetClassesWithSummaryByBranchAndSessionPaginatedQuery, useLazyGetClassesWithSummaryByBranchAndSessionPaginatedQuery } from '../../redux/api/classApi';
import { supabase } from '../../supabaseClient';

const classes = () => {
  const router = useRouter();
  const { branchId, sessionId, user, schoolId } = useSelector((state) => state.auth);

  const PAGE_SIZE = 5;
  const [classesList, setClassesList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetClassesWithSummaryByBranchAndSessionPaginatedQuery(
    { branchId, sessionId, offset: 0, limit: PAGE_SIZE },
    { skip: !sessionId || !branchId }
  );
  const [trigger, { isFetching, error: classesError }] = useLazyGetClassesWithSummaryByBranchAndSessionPaginatedQuery();

  const getClassKey = (c) => String(c?.class_id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId || !sessionId) return;
    try {
      const result = await trigger({ branchId, sessionId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setClassesList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getClassKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getClassKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // handled by error alert
    }
  };

  useEffect(() => {
    if (classesError) {
      Alert.alert('Error', classesError.message || 'Failed to load classes');
    }
  }, [classesError]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (classesList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setClassesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (classesList.length === 0 && !isFetchingInitial && !initialData && branchId && sessionId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, sessionId]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setClassesList(initialData.items);
        setOffset(initialData.items.length);
        setHasMore(initialData.items.length === PAGE_SIZE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId || !sessionId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setClassesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId || !sessionId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleEdit = (classItem) => {
    router.push({
      pathname: '/screens/forms/addClass',
      params: {
        classId: classItem.class_id,
      },
    });
  };


  const handleLeaderboard = (classItem) => {
    // Navigate to leaderboard screen with classId
    router.push({
      pathname: '/screens/leaderboard',
      params: {
        classId: classItem.class_id,
      },
    });
  };

  const handleAttendance = (classItem) => {
    router.push({
      pathname: '/screens/attendance',
      params: {
        classId: classItem.class_id,
      },
    });
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

  const handleTimetable = (classItem) => {
    // Navigate to timetable screen
    router.push({
      pathname: "/screens/timetable",
      params: {
        classId: classItem.class_id,
        className: `${classItem.class_Name} - Section ${classItem.section}`,
      },
    });
  };

  const handleGroupInfo = async (classItem) => {
    try {
      // Find the chat group for this class
      const { data: chatData, error } = await supabase
        .from("chat")
        .select("id, group_Name, group_Image")
        .eq("class_Id", classItem.class_id)
        .eq("type", "group")
        .maybeSingle();

      if (error) {
        Alert.alert('Error', 'Failed to load group information');
        return;
      }

      if (!chatData?.id) {
        Alert.alert('Info', 'No group chat found for this class');
        return;
      }

      router.push({
        pathname: '/screens/groupInfo',
        params: {
          chatId: chatData.id.toString(),
          chatName: chatData.group_Name || `${classItem.class_Name} - Section ${classItem.section}`,
          chatImage: chatData.group_Image || '',
        },
      });
    } catch (err) {
      console.error('Error fetching class chat:', err);
      Alert.alert('Error', 'Failed to load group information');
    }
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

  // Filter classes based on search query
  const filteredClassesList = React.useMemo(() => {
    if (!searchQuery.trim()) return classesList;
    const query = searchQuery.toLowerCase().trim();
    return classesList.filter((classItem) => {
      const className = (classItem.class_Name || '').toLowerCase();
      const section = (classItem.section || '').toLowerCase();
      return className.includes(query) || section.includes(query);
    });
  }, [classesList, searchQuery]);

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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search classes by name or section..."
        />

        {/* Class List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Class List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Class Cards */}
        <FlatList
          data={filteredClassesList}
          keyExtractor={(classItem) => String(classItem.class_id)}
          renderItem={({ item: classItem }) => (
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
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                          onPress={() => handleEdit(classItem)}
                          style={[styles.actionButton, styles.editButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editButtonText}>
                            Edit
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleLeaderboard(classItem)}
                          style={[styles.actionButton, styles.leaderboardButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.leaderboardButtonText}>
                            Leaderboard
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleAttendance(classItem)}
                          style={[styles.actionButton, styles.attendanceButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.attendanceButtonText}>
                            Attendance
                          </Text>
                        </TouchableOpacity>
    
                        <TouchableOpacity
                          onPress={() => handleStudents(classItem.class_id)}
                          style={[styles.actionButton, styles.studentsButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.studentsButtonText}>
                            Students
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleTimetable(classItem)}
                          style={[styles.actionButton, styles.timetableButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.timetableButtonText}>
                            Timetable
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleGroupInfo(classItem)}
                          style={[styles.actionButton, styles.groupButton]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.groupButtonText}>
                            Group
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
          )}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (classesList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <ClassCardSkeleton key={index} />
                ))}
              </>
            ) : classesList.length === 0 ? (
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
            ) : null
          }
          ListFooterComponent={
            classesList.length > 0 && !isRefreshing && isLoadingMore ? (
              <ClassCardSkeleton />
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={PAGE_SIZE}
          windowSize={PAGE_SIZE * 2}
        />

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
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
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
  studentsButton: {
    backgroundColor: '#EFF6FF',
  },
  studentsButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#3B82F6',
  },
  timetableButton: {
    backgroundColor: '#FEF3C7',
  },
  timetableButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#F59E0B',
  },
  groupButton: {
    backgroundColor: '#E0E7FF',
  },
  groupButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#6366F1',
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