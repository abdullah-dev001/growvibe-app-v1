import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import NoteCardSkeleton from '../../components/skeletons/NoteCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetNotesByBranchAndClassPaginatedQuery, useLazyGetNotesByBranchAndClassPaginatedQuery } from '../../redux/api/noteApi';

const PAGE_SIZE = 5;

const impNotesList = () => {
  const router = useRouter();
  const { branchId, classId } = useSelector((state) => state.auth);

  const [notesList, setNotesList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetNotesByBranchAndClassPaginatedQuery(
    { branchId, classId: classId || null, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId || !classId }
  );
  const [trigger, { isFetching, error: notesError }] = useLazyGetNotesByBranchAndClassPaginatedQuery();

  useEffect(() => {
    if (notesError) {
      Alert.alert('Error', notesError.message || 'Failed to load notes');
    }
  }, [notesError]);

  const getNoteKey = (note, index) => {
    if (note?.id !== null && note?.id !== undefined) {
      return String(note.id);
    }
    return `note-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId || !classId) return;
    try {
      const result = await trigger({ branchId, classId: classId || null, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setNotesList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getNoteKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getNoteKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // Error handled by notesError alert above
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    // Show skeleton for minimum 1s only on cold load (no cached data)
    if (!initialData?.items?.length) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (notesList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setNotesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
      hasLoadedOnceRef.current = true;
    } else if (notesList.length === 0 && !isFetchingInitial && !initialData && branchId && classId) {
      loadPage(0, true).then(() => {
        hasLoadedOnceRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId || !classId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setNotesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId || !classId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false);
  };

  const handleEdit = (note) => {
    // Edit note
  };

  const handleDelete = (note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.note_Title || 'this note'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
            // Delete note
          } },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadgeText = (isForEntireBranch) => {
    return isForEntireBranch ? 'Entire Branch' : 'Specific Class';
  };

  const getStatusBadgeStyle = (isForEntireBranch) => {
    return isForEntireBranch 
      ? { backgroundColor: '#EFF6FF', color: '#1CACF3' } 
      : { backgroundColor: '#F3E8FF', color: '#8B5CF6' };
  };

  const renderNoteCard = ({ item: note }) => {
    const statusBadgeStyle = getStatusBadgeStyle(note.is_For_Entire_Branch);

    return (
      <View style={styles.card}>
        {/* Header with Title and Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {note.note_Title || 'Untitled Note'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusBadgeStyle.color }]}>
                {getStatusBadgeText(note.is_For_Entire_Branch)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {note.note_Description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={4}>
              {note.note_Description}
            </Text>
          </View>
        )}

        {/* Footer with Role and Date */}
        <View style={styles.footer}>
          {note.created_By_Role && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Created By:</Text>
              <Text style={styles.roleValue}>{note.created_By_Role}</Text>
            </View>
          )}
          {note.created_at && (
            <Text style={styles.dateText}>{formatDate(note.created_at)}</Text>
          )}
        </View>
      </View>
    );
  };

  if (!branchId || !classId) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Branch or Class information is missing.</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Important Notes</Text>
            <Text style={styles.subTitle}>View all important notes</Text>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Notes List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Notes List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Notes Cards */}
        <FlatList
          data={notesList}
          keyExtractor={(note, index) => getNoteKey(note, index)}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (notesList.length === 0 && !initialData)) && !isRefreshing ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <NoteCardSkeleton key={index} />
                ))}
              </View>
            ) : notesList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No important notes found.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            notesList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default impNotesList;

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
    marginRight: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    display: 'flex',
  },
  titleContainer: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: hp(2.2),
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  description: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: hp(2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#9CA3AF',
    marginRight: 6,
  },
  roleValue: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
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
