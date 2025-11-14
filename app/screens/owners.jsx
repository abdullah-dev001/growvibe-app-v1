import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pen from '../../assets/icons/Pen';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import OwnerCardSkeleton from '../../components/skeletons/OwnerCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetOwnersPaginatedQuery, useLazyGetOwnersPaginatedQuery } from '../../redux/api/ownerApi';

const owners = () => {
  const router = useRouter();

  const PAGE_SIZE = 5;
  const [ownersList, setOwnersList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetOwnersPaginatedQuery({ offset: 0, limit: PAGE_SIZE });
  const [trigger, { isFetching, error: ownersError } ] = useLazyGetOwnersPaginatedQuery();

  if (ownersError) {
    Alert.alert('Error', ownersError.message || 'Failed to load owners');
  }

  const getOwnerKey = (o) => String(o?.owner_id || o?.auth_User_Id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    try {
      const result = await trigger({ offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setOwnersList((prev) => {
        if (refresh || nextOffset === 0) return items;
        // de-duplicate by id
        const existing = new Set(prev.map(getOwnerKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getOwnerKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      // If returned fewer than PAGE_SIZE, we've reached the end
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // handled by ownersError alert above
    }
  };

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize from cache (if available) without refetch
    if (ownersList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setOwnersList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (ownersList.length === 0 && !isFetchingInitial && !initialData) {
      // No cache available, load first page
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setOwnersList(initialData.items);
        setOffset(initialData.items.length);
        setHasMore(initialData.items.length === PAGE_SIZE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    // Refetch initial page and update from latest result (leverages cache correctly)
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setOwnersList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing) return; // don't load more while refreshing
    if (isFetching || isLoadingMore) return; // prevent concurrent loads
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleAddOwner = () => router.push('/screens/forms/addOwner');
  const handleEdit = (owner) => {
    const authId = owner.auth_User_Id;
    if (!authId) {
      Alert.alert('Error', 'Owner auth ID not available');
      return;
    }
    router.push({
      pathname: '/screens/forms/addOwner',
      params: { ownerId: authId },
    });
  };
  const handleViewSchools = (owner) => {
    // Navigate to schools screen filtered by owner
    router.push({
      pathname: '/screens/schools',
      params: {
        ownerId: owner.owner_id || owner.auth_User_Id,
      },
    });
  };

  const getStatusColor = (status) => (status ? '#10B981' : '#EF4444');
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Owners</Text>
            <Text style={styles.subTitle}>Manage owners</Text>
          </View>
          <Button title="Add Owner" onPress={handleAddOwner} icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />} bgColor="#10B981" textColor="#FFFFFF" size="small" />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Owners List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Owner List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Owners List */}
        <FlatList
          data={ownersList}
          keyExtractor={(owner) => String(owner.owner_id || owner.auth_User_Id)}
          renderItem={({ item: owner }) => (
            <View style={styles.card}>
                  {/* Header with Image, Name and Status */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatar} />
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.cardTitle}>
                          {owner.full_Name || 'N/A'}
                        </Text>
                    <Text style={styles.cardSubtitle}>
                          {owner.email || owner.phone || 'No contact'}
                        </Text>
                      </View>
                    </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: owner.profile_Status ? '#D1FAE5' : '#FEE2E2' }
                  ]}
                >
                      <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(owner.profile_Status) }
                    ]}
                      >
                        {owner.profile_Status ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
              <View style={styles.cardDateRow}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>
                        Created:
                      </Text>
                  <Text style={styles.dateValue}>
                        {formatDate(owner.created_at)}
                      </Text>
                    </View>
                <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleEdit(owner)}
                    style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
                    <Text style={styles.editButtonText}>
                          Edit
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
            (showSkeleton || isFetchingInitial || isFetching || (ownersList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <OwnerCardSkeleton key={index} />
                ))}
              </>
            ) : ownersList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No owners found. Create your first owner to get started.
                </Text>
                <Button
                  title="Add Owner"
                  onPress={handleAddOwner}
                  size="small"
                  bgColor="#10B981"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            ownersList.length > 0 && !isRefreshing && isLoadingMore ? (
              <OwnerCardSkeleton />
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={5}
          windowSize={5}
        />
      </View>
    </ScreenWrapper>
  );
};

export default owners;

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
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  cardDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  dateValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    marginLeft: hp(0.5),
  },
  actionButtonsRow: {
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
