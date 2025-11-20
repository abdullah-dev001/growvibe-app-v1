import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import { hp } from "../../helpers/common";
import { useGetFeesByStudentPaginatedQuery, useLazyGetFeesByStudentPaginatedQuery } from "../../redux/api/feeApi";

const PAGE_SIZE = 10;

const studentFees = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const studentId = user?.id;

  const [feesList, setFeesList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetFeesByStudentPaginatedQuery(
    { studentId, offset: 0, limit: PAGE_SIZE },
    { skip: !studentId }
  );

  const [trigger, { isFetching, error: feesError }] = useLazyGetFeesByStudentPaginatedQuery();

  const getFeeKey = (fee) => String(fee?.id || fee?.created_at);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!studentId) return;
    try {
      const result = await trigger({ studentId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setFeesList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getFeeKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getFeeKey(i)))];
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
    if (feesError) {
      Alert.alert("Error", feesError.message || "Failed to load fees");
    }
  }, [feesError]);

  useEffect(() => {
    if (feesList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setFeesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
      setHasLoadedInitial(true);
    } else if (feesList.length === 0 && !isFetchingInitial && !initialData && studentId) {
      setHasLoadedInitial(true);
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, studentId]);

  const handleRefresh = async () => {
    if (isRefreshing || !studentId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setFeesList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !studentId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    if (status === "paid") return "#10B981";
    if (status === "pending") return "#F59E0B";
    if (status === "overdue") return "#EF4444";
    return "#6B7280";
  };

  const getStatusBgColor = (status) => {
    if (status === "paid") return "#D1FAE5";
    if (status === "pending") return "#FEF3C7";
    if (status === "overdue") return "#FEE2E2";
    return "#F3F4F6";
  };

  const renderFeeCard = ({ item: fee }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle}>Month: {fee.month || "N/A"}</Text>
            <Text style={styles.cardSubtitle}>
              Created: {formatDate(fee.created_at)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(fee.fee_Status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(fee.fee_Status) },
              ]}
            >
              {fee.fee_Status ? fee.fee_Status.charAt(0).toUpperCase() + fee.fee_Status.slice(1) : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Fee:</Text>
            <Text style={styles.cardValue}>Rs. {fee.fee || 0}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Remaining Fee:</Text>
            <Text style={styles.cardValue}>Rs. {fee.remaining_Fee || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Fees</Text>
            <Text style={styles.subTitle}>
              View your fee records and payment history
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Fee List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Fee List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Fee Cards */}
        <FlatList
          data={feesList}
          keyExtractor={getFeeKey}
          renderItem={renderFeeCard}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            isFetchingInitial || isFetching || (feesList.length === 0 && !initialData) ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading fees...</Text>
              </View>
            ) : feesList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No fees found.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            feesList.length > 0 && !isRefreshing && isLoadingMore ? (
              <View style={styles.loadingMore}>
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

export default studentFees;

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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-SemiBold",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginBottom: hp(0.3),
  },
  cardSubtitle: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: "Poppins-Medium",
  },
  cardBody: {
    marginTop: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  cardValue: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(2),
    textAlign: "center",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
});

