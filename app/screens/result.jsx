import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import ResultCardSkeleton from '../../components/skeletons/ResultCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetResultsByBranchAndClassPaginatedQuery, useLazyGetResultsByBranchAndClassPaginatedQuery } from '../../redux/api/resultApi';

const PAGE_SIZE = 5;

const result = () => {
  const router = useRouter();
  const { studentId, studentName } = useLocalSearchParams();
  const { branchId, classId, user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';

  const [resultList, setResultList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetResultsByBranchAndClassPaginatedQuery(
    { branchId, studentId: studentId || null, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: resultError }] = useLazyGetResultsByBranchAndClassPaginatedQuery();

  useEffect(() => {
    if (resultError) {
      Alert.alert('Error', resultError.message || 'Failed to load results');
    }
  }, [resultError]);

  const getResultKey = (r, index) => {
    // Use id if available, otherwise use index as fallback to ensure unique keys
    if (r?.id !== null && r?.id !== undefined) {
      return String(r.id);
    }
    // Fallback to index if id is missing
    return `result-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, studentId: studentId || null, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setResultList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getResultKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getResultKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // Error handled by resultError alert above
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
    if (resultList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setResultList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
      hasLoadedOnceRef.current = true;
    } else if (resultList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true).then(() => {
        hasLoadedOnceRef.current = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, studentId]);

  // Removed focus refetch to allow RTK Query cache + tag invalidation to handle freshness

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setResultList(items);
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

  const handleAddResult = () => {
    // Pass studentId if available from route params
    if (studentId) {
      router.push({
        pathname: '/screens/forms/addResult',
        params: { studentId },
      });
    } else {
      router.push('/screens/forms/addResult');
    }
  };

  const handleEdit = (result) => {
    // Edit result
  };

  const handleDelete = (result) => {
    Alert.alert(
      'Delete Result',
      `Are you sure you want to delete this result?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
            // Delete result
          } },
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

  const renderResultCard = ({ item: result }) => {
    // Since we're now creating results for a single student, result_students should have only one item
    const resultStudents = result.result_students || [];
    const studentResult = resultStudents[0] || null;
    // Use studentName from params if available, otherwise try to get from studentResult
    const displayStudentName = studentName || 'Student';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle}>{result.result_Title || 'N/A'}</Text>
            <Text style={styles.cardDescription}>{result.result_Description || 'No description'}</Text>
            <Text style={styles.cardDate}>Expires: {formatDate(result.expire_Date)}</Text>
          </View>
          {isTeacher && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(result)}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(result)}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Total Marks */}
        <View style={styles.totalMarksSection}>
          <Text style={styles.totalMarksLabel}>Total Marks:</Text>
          <Text style={styles.totalMarksValue}>{result.total_Marks || 'N/A'}</Text>
        </View>

        {/* Student Result - Single Student Display */}
        {studentResult && (
          <View style={styles.studentResultSection}>
            <View style={styles.studentInfoSection}>
              <Text style={styles.studentNameLabel}>Student:</Text>
              <Text style={styles.studentNameValue}>{displayStudentName}</Text>
            </View>
            <View style={styles.studentTotalMarksSection}>
              <Text style={styles.studentTotalMarksLabel}>Student Total Marks:</Text>
              <Text style={styles.studentTotalMarksValue}>{studentResult.total_Marks || 'N/A'}</Text>
            </View>

            {/* Subjects */}
            {studentResult.subjects && studentResult.subjects.length > 0 && (
              <View style={styles.subjectsSection}>
                <Text style={styles.subjectsLabel}>Subjects:</Text>
                <View style={styles.subjectsContainer}>
                  {studentResult.subjects.map((subject, subIndex) => (
                    <View key={subIndex} style={styles.subjectItem}>
                      <Text style={styles.subjectName}>{subject.subject_Name || 'N/A'}</Text>
                      <Text style={styles.subjectMarks}>
                        {subject.obtained_Makrs || '0'} / {subject.total_Marks || '0'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
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
            <Text style={styles.headerTitle}>Results</Text>
            <Text style={styles.subTitle}>
              {studentName ? `${studentName}'s Results` : (isTeacher ? 'Manage student results' : 'View student results')}
            </Text>
          </View>
          {isTeacher && (
            <Button
              title="Add Result"
              onPress={handleAddResult}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#10B981"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Result List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Result List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Result Cards */}
        <FlatList
          data={resultList}
          keyExtractor={(result, index) => getResultKey(result, index)}
          renderItem={renderResultCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (resultList.length === 0 && !initialData)) && !isRefreshing ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <ResultCardSkeleton key={index} />
                ))}
              </View>
            ) : resultList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {isTeacher 
                    ? 'No results found. Create your first result to get started.'
                    : 'No results found.'}
                </Text>
                {isTeacher && (
                  <Button
                    title="Add Result"
                    onPress={handleAddResult}
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
            resultList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default result;

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
    fontFamily: 'Poppins-Medium',
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
  cardDescription: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
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
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
  totalMarksSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  totalMarksLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
  },
  totalMarksValue: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#10B981',
  },
  studentResultSection: {
    marginTop: 12,
  },
  studentInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentNameLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
  },
  studentNameValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  studentTotalMarksSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  studentTotalMarksLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
  },
  studentTotalMarksValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#10B981',
  },
  subjectsSection: {
    marginTop: 8,
  },
  subjectsLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  subjectsContainer: {
    marginTop: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
  },
  subjectMarks: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#10B981',
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

