import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../assets/icons/Plus";
import BranchCard from "../../components/BranchCard";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import BranchCardSkeleton from "../../components/skeletons/branchCardSkeleton";
import { hp } from "../../helpers/common";
import { useGetBranchesBySchoolPaginatedQuery, useLazyGetBranchesBySchoolPaginatedQuery } from "../../redux/api/branchApi";

const Branches = () => {
  const { schoolId, schoolName } = useLocalSearchParams();
  const { sessionRestored } = useSelector((state) => state.auth);
  const router = useRouter();

  const PAGE_SIZE = 5;
  const [branchesList, setBranchesList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure numeric schoolId and wait for session restoration
  const numericSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetBranchesBySchoolPaginatedQuery(
    { schoolId: numericSchoolId, offset: 0, limit: PAGE_SIZE },
    { skip: !sessionRestored || !numericSchoolId }
  );
  const [trigger, { isFetching, error }] = useLazyGetBranchesBySchoolPaginatedQuery();

  const getBranchKey = (b) => String(b?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!numericSchoolId) return;
    try {
      const result = await trigger({ schoolId: numericSchoolId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setBranchesList((prev) => {
        if (refresh || nextOffset === 0) return items;
        // de-duplicate by id
        const existing = new Set(prev.map(getBranchKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getBranchKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      // If returned fewer than PAGE_SIZE, we've reached the end
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // handled by error alert
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error.message || 'Failed to load branches');
    }
  }, [error]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize from cache (if available) without refetch
    if (branchesList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setBranchesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (branchesList.length === 0 && !isFetchingInitial && !initialData && numericSchoolId && sessionRestored) {
      // No cache available, load first page
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, numericSchoolId, sessionRestored]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setBranchesList(initialData.items);
        setOffset(initialData.items.length);
        setHasMore(initialData.items.length === PAGE_SIZE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial]);

  const handleRefresh = async () => {
    if (isRefreshing || !numericSchoolId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setBranchesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !numericSchoolId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleEdit = (branch) => {
    router.push({
      pathname: '/screens/forms/addBranch',
      params: {
        branchId: branch.id,
        schoolId,
        schoolName,
      },
    });
  };

  const handleAttendanceSetting = (branch) => {
    if (!branch?.id || !branch?.school_Id) {
      Alert.alert('Missing data', 'Branch information is incomplete.');
      return;
    }
    router.push({
      pathname: '/screens/attendanceSetting',
      params: {
        branchId: branch.id,
        branchName: branch.branch_Name,
        schoolId: branch.school_Id,
      },
    });
  };

  const handleAddBranch = () => {
    router.push({
      pathname: "/screens/forms/addBranch",
      params: { schoolId, schoolName },
    });
  };

  // Filter branches based on search query
  const filteredBranchesList = React.useMemo(() => {
    if (!searchQuery.trim()) return branchesList;
    const query = searchQuery.toLowerCase().trim();
    return branchesList.filter((branch) => {
      const name = (branch.branch_Name || '').toLowerCase();
      const address = (branch.branch_Address || '').toLowerCase();
      const contact = (branch.branch_Contact || '').toLowerCase();
      return name.includes(query) || address.includes(query) || contact.includes(query);
    });
  }, [branchesList, searchQuery]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Branches</Text>
            <Text style={styles.subTitle}>{schoolName}</Text>
          </View>
          <Button
            title="Add Branch"
            onPress={handleAddBranch}
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
          placeholder="Search branches by name, address, or contact..."
        />

        {/* Branch List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Branch List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Branch Cards */}
        <FlatList
          data={filteredBranchesList}
          keyExtractor={(branch) => String(branch.id)}
          renderItem={({ item: branch }) => (
                <BranchCard
                  branch_Name={branch.branch_Name}
                  branch_Address={branch.branch_Address}
                  branch_Contact={branch.branch_Contact}
                  branch_Status={branch.branch_Status}
                  branch_Subscription_Fee={branch.branch_Subscription_Fee}
                  created_at={branch.created_at}
                  onEdit={() => handleEdit(branch)}
                  onAttendanceSetting={() => handleAttendanceSetting(branch)}
                />
          )}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (branchesList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <BranchCardSkeleton key={index} />
                ))}
              </>
            ) : branchesList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No branches found. Create your first branch to get started.
                </Text>
                <Button
                  title="Add Branch"
                  onPress={handleAddBranch}
                  size="small"
                  bgColor="#1CACF3"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            branchesList.length > 0 && !isRefreshing && isLoadingMore && !searchQuery ? (
              <BranchCardSkeleton />
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

export default Branches;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-Bold",
    color: "#111827",
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    marginTop: hp(0.5),
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  listTitle: {
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: "uppercase",
  },
  listDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "#EF4444",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(2),
    textAlign: "center",
  },
});
