import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import DiaryCardSkeleton from '../../components/skeletons/DiaryCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetDiariesByBranchAndClassPaginatedQuery, useLazyGetDiariesByBranchAndClassPaginatedQuery } from '../../redux/api/diaryApi';

const PAGE_SIZE = 5;

const diary = () => {
  const router = useRouter();
  const { branchId, classId } = useSelector((state) => state.auth);

  const [diaryList, setDiaryList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetDiariesByBranchAndClassPaginatedQuery(
    { branchId, classId: classId || null, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: diaryError }] = useLazyGetDiariesByBranchAndClassPaginatedQuery();

  useEffect(() => {
    if (diaryError) {
      Alert.alert('Error', diaryError.message || 'Failed to load diary entries');
    }
  }, [diaryError]);

  const getDiaryKey = (d, index) => {
    // Use id if available, otherwise use index as fallback to ensure unique keys
    if (d?.id !== null && d?.id !== undefined) {
      return String(d.id);
    }
    // Fallback to index if id is missing
    return `diary-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, classId: classId || null, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setDiaryList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getDiaryKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getDiaryKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // Error handled by diaryError alert above
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (diaryList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setDiaryList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (diaryList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

  // Refetch when screen comes into focus (e.g., after creating a diary)
  useFocusEffect(
    useCallback(() => {
      if (branchId && !isFetchingInitial && !isRefreshing) {
        // Refetch the first page to get latest data and update the list
        refetch().then((result) => {
          if (result?.data?.items) {
            const items = result.data.items;
            setDiaryList(items);
            setOffset(items.length);
            setHasMore(items.length === PAGE_SIZE);
          }
        }).catch(() => {
          // Error already handled by diaryError alert
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId, classId, refetch, isFetchingInitial, isRefreshing])
  );

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setDiaryList(items);
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

  const handleAddDiary = () => {
    router.push('/screens/forms/addDiary');
  };

  const handleEdit = (diary) => {
    console.log('Edit diary:', diary);
  };

  const handleDelete = (diary) => {
    Alert.alert(
      'Delete Diary',
      `Are you sure you want to delete this diary entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete diary:', diary.id) },
      ]
    );
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

  const renderDiaryCard = ({ item: diary }) => {
    // Parse subjects if it's a string (JSON)
    let subjects = [];
    if (diary.subjects) {
      try {
        subjects = typeof diary.subjects === 'string' ? JSON.parse(diary.subjects) : diary.subjects;
      } catch (e) {
        console.error('Error parsing subjects:', e);
        subjects = [];
      }
    }

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardDate}>{formatDate(diary.date)}</Text>
            <Text style={styles.cardEmail}>{diary.created_By_Email}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleEdit(diary)}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(diary)}
              style={styles.deleteButton}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Important Note:</Text>
          <Text style={styles.noteText}>{diary.imp_Note}</Text>
        </View>

        {/* Subjects */}
        {subjects && subjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.subjectsLabel}>Subjects:</Text>
            {subjects.map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={styles.subjectName}>{subject.subject_Name}</Text>
                <Text style={styles.subjectTodo}>{subject.todo}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Diary</Text>
            <Text style={styles.subTitle}>Manage diary entries</Text>
          </View>
          <Button
            title="Add Diary"
            onPress={handleAddDiary}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#10B981"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Diary List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Diary List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Diary Cards */}
        <FlatList
          data={diaryList}
          keyExtractor={(diary, index) => getDiaryKey(diary, index)}
          renderItem={renderDiaryCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (isFetchingInitial || isFetching) && diaryList.length === 0 ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <DiaryCardSkeleton key={index} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No diary entries found. Create your first diary entry to get started.
                </Text>
                <Button
                  title="Add Diary"
                  onPress={handleAddDiary}
                  size="small"
                  bgColor="#10B981"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            )
          }
          ListFooterComponent={
            diaryList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default diary;

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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardDate: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
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
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
  noteSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  noteLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  noteText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    lineHeight: 20,
  },
  subjectsSection: {
    marginTop: 8,
  },
  subjectsLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  subjectItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  subjectName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subjectTodo: {
    fontSize: hp(1.3),
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
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: '#CED0CE',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
});
