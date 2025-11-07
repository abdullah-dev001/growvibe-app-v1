import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import DatesheetCardSkeleton from '../../components/skeletons/DatesheetCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetDatesheetsByBranchAndClassPaginatedQuery, useLazyGetDatesheetsByBranchAndClassPaginatedQuery } from '../../redux/api/datesheetApi';

const PAGE_SIZE = 5;

const datesheet = () => {
  const router = useRouter();
  const { branchId, classId } = useSelector((state) => state.auth);

  const [datesheetList, setDatesheetList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetDatesheetsByBranchAndClassPaginatedQuery(
    { branchId, classId: classId || null, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: datesheetError }] = useLazyGetDatesheetsByBranchAndClassPaginatedQuery();

  useEffect(() => {
    if (datesheetError) {
      Alert.alert('Error', datesheetError.message || 'Failed to load datesheet entries');
    }
  }, [datesheetError]);

  const getDatesheetKey = (d, index) => {
    // Use id if available, otherwise use index as fallback to ensure unique keys
    if (d?.id !== null && d?.id !== undefined) {
      return String(d.id);
    }
    // Fallback to index if id is missing
    return `datesheet-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, classId: classId || null, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setDatesheetList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map((item) => getDatesheetKey(item, 0)));
        const merged = [...prev, ...items.filter((i) => !existing.has(getDatesheetKey(i, 0)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // Error handled by datesheetError alert above
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (datesheetList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setDatesheetList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
      hasLoadedOnceRef.current = true;
    } else if (datesheetList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true).then(() => {
        hasLoadedOnceRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

  // Refetch when screen comes into focus (e.g., after creating a datesheet)
  // Only refetch if we've already loaded data once to avoid loops
  useFocusEffect(
    useCallback(() => {
      if (branchId && hasLoadedOnceRef.current && !isFetchingInitial && !isRefreshing && !isFetching) {
        // Refetch the first page to get latest data and update the list
        refetch().then((result) => {
          if (result?.data?.items) {
            const items = result.data.items;
            setDatesheetList(items);
            setOffset(items.length);
            setHasMore(items.length === PAGE_SIZE);
          }
        }).catch(() => {
          // Error already handled by datesheetError alert
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId, classId])
  );

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setDatesheetList(items);
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

  const handleAddDatesheet = () => {
    router.push('/screens/forms/addDatesheet');
  };

  const handleEdit = (datesheet) => {
    console.log('Edit datesheet:', datesheet);
  };

  const handleDelete = (datesheet) => {
    Alert.alert(
      'Delete Datesheet',
      `Are you sure you want to delete "${datesheet.datesheet_Title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete datesheet:', datesheet.id) },
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

  const renderDatesheetCard = ({ item: datesheet }) => {
    // Parse subjects if it's a string (JSON)
    let subjects = [];
    if (datesheet.subjects) {
      try {
        subjects = typeof datesheet.subjects === 'string' ? JSON.parse(datesheet.subjects) : datesheet.subjects;
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
            <Text style={styles.cardTitle}>{datesheet.datesheet_Title || 'Untitled'}</Text>
            <Text style={styles.cardExpireDate}>Expires: {formatDate(datesheet.expire_Date)}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleEdit(datesheet)}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(datesheet)}
              style={styles.deleteButton}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {datesheet.datesheet_Description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{datesheet.datesheet_Description}</Text>
          </View>
        )}

        {/* Subjects */}
        {subjects && subjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.subjectsLabel}>Subjects:</Text>
            {subjects.map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <Text style={styles.subjectName}>{subject.subject_Name}</Text>
                <Text style={styles.subjectDate}>Date: {formatDate(subject.date)}</Text>
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
            <Text style={styles.headerTitle}>Datesheet</Text>
            <Text style={styles.subTitle}>Manage exam datesheets</Text>
          </View>
          <Button
            title="Add Datesheet"
            onPress={handleAddDatesheet}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#8B5CF6"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Datesheet List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Datesheet List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Datesheet Cards */}
        <FlatList
          data={datesheetList}
          keyExtractor={(datesheet, index) => getDatesheetKey(datesheet, index)}
          renderItem={renderDatesheetCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (isFetchingInitial || isFetching) && datesheetList.length === 0 ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <DatesheetCardSkeleton key={index} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No datesheet entries found. Create your first datesheet to get started.
                </Text>
                <Button
                  title="Add Datesheet"
                  onPress={handleAddDatesheet}
                  size="small"
                  bgColor="#8B5CF6"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            )
          }
          ListFooterComponent={
            datesheetList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default datesheet;

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
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardExpireDate: {
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
  descriptionSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  descriptionLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  descriptionText: {
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
    borderLeftColor: '#8B5CF6',
  },
  subjectName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subjectDate: {
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
