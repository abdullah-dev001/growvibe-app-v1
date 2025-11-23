import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import SignedAvatar from '../../components/SignedAvatar';
import LeaderboardCardSkeleton from '../../components/skeletons/LeaderboardCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetLeaderboardsByBranchAndClassPaginatedQuery, useLazyGetLeaderboardsByBranchAndClassPaginatedQuery } from '../../redux/api/leaderboardApi';

const PAGE_SIZE = 5;

const leaderboard = () => {
  const router = useRouter();
  const { classId: classIdFromParams } = useLocalSearchParams();
  const { branchId, classId: classIdFromRedux, user } = useSelector((state) => state.auth);
  // Use classId from params if available, otherwise use Redux store
  const classId = classIdFromParams || classIdFromRedux;
  const isTeacher = user?.role === 'teacher';

  const [leaderboardList, setLeaderboardList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetLeaderboardsByBranchAndClassPaginatedQuery(
    { branchId, classId: classId || null, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: leaderboardError }] = useLazyGetLeaderboardsByBranchAndClassPaginatedQuery();

  useEffect(() => {
    if (leaderboardError) {
      Alert.alert('Error', leaderboardError.message || 'Failed to load leaderboards');
    }
  }, [leaderboardError]);

  const getLeaderboardKey = (l, index) => {
    if (l?.leaderboard_id !== null && l?.leaderboard_id !== undefined) {
      return String(l.leaderboard_id);
    }
    return `leaderboard-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, classId: classId || null, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setLeaderboardList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getLeaderboardKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getLeaderboardKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // Error handled by leaderboardError alert above
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    // Show skeleton only if no cached data exists
    if (!initialData?.items) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (leaderboardList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setLeaderboardList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (leaderboardList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setLeaderboardList(initialData.items);
        setOffset(initialData.items.length);
        setHasMore(initialData.items.length === PAGE_SIZE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setLeaderboardList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false);
  };

  const handleAddLeaderboard = () => {
    router.push('/screens/forms/addLeaderboard');
  };

  const handleEdit = (leaderboard) => {
    router.push({
      pathname: '/screens/forms/addLeaderboard',
      params: {
        leaderboardId: leaderboard.leaderboard_id,
      },
    });
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

  const renderLeaderboardCard = ({ item: leaderboard }) => {
    const students = leaderboard.students || [];
    const title = leaderboard.title || leaderboard.leaderboard_title || 'N/A';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDate}>Expires: {formatDate(leaderboard.expire_date)}</Text>
          </View>
          {isTeacher && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(leaderboard)}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Students Ranking */}
        {students && students.length > 0 && (
          <View style={styles.studentsSection}>
            <Text style={styles.studentsLabel}>Rankings:</Text>
            {students
              .sort((a, b) => parseInt(a.rank || 0) - parseInt(b.rank || 0))
              .map((student, index) => {
                const studentId = student.studentId || student.student_id;
                const fullName = student.fullName || student.full_name;
                const email = student.email;
                const userImage = student.userImage || student.user_image;
                const rank = student.rank;

                return (
                  <View key={studentId || index} style={styles.studentItem}>
                    <View style={styles.studentRankContainer}>
                      <View style={[styles.rankBadge, { backgroundColor: getRankColor(parseInt(rank || 0)) }]}>
                        <Text style={styles.rankText}>#{rank}</Text>
                      </View>
                    </View>
                    <View style={styles.studentInfo}>
                      <SignedAvatar
                        imageUrl={userImage}
                          style={styles.studentAvatar}
                        placeholderLabel={fullName || email || 'S'}
                        />
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{fullName || 'N/A'}</Text>
                        <Text style={styles.studentEmail}>{email || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}
      </View>
    );
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#E5E7EB'; // Gray for others
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.subTitle}>
              {isTeacher ? 'Manage student leaderboards' : 'View student leaderboards'}
            </Text>
          </View>
          {isTeacher && (
            <Button
              title="Add Leaderboard"
              onPress={handleAddLeaderboard}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#10B981"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Leaderboard List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Leaderboard List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Leaderboard Cards */}
        <FlatList
          data={leaderboardList}
          keyExtractor={(leaderboard, index) => getLeaderboardKey(leaderboard, index)}
          renderItem={renderLeaderboardCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (leaderboardList.length === 0 && !initialData)) && !isRefreshing ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <LeaderboardCardSkeleton key={index} />
                ))}
              </View>
            ) : leaderboardList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {isTeacher 
                    ? 'No leaderboards found. Create your first leaderboard to get started.'
                    : 'No leaderboards found.'}
                </Text>
                {isTeacher && (
                  <Button
                    title="Add Leaderboard"
                    onPress={handleAddLeaderboard}
                    size="small"
                    bgColor="#10B981"
                    textColor="#FFFFFF"
                    icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                  />
                )}
              </View>
            ) : null
          }
          ListFooterComponent={
            leaderboardList.length > 0 && !isRefreshing && isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
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

export default leaderboard;

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
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-SemiBold',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  studentsSection: {
    marginTop: 12,
  },
  studentsLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  studentRankContainer: {
    marginRight: 12,
  },
  rankBadge: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
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
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});

