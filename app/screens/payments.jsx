import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import Plus from "../../assets/icons/Plus";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import { hp } from "../../helpers/common";
import { useGetPaymentsBySchoolPaginatedQuery, useLazyGetPaymentsBySchoolPaginatedQuery } from "../../redux/api/paymentApi";

const PAGE_SIZE = 5;

const payments = () => {
  const router = useRouter();
  const { schoolId, schoolName } = useLocalSearchParams();

  const [paymentsList, setPaymentsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetPaymentsBySchoolPaginatedQuery(
    { schoolId: Number(schoolId), offset: 0, limit: PAGE_SIZE },
    { skip: !schoolId }
  );
  const [trigger, { isFetching, error: paymentsError }] = useLazyGetPaymentsBySchoolPaginatedQuery();

  const getPaymentKey = (p) => String(p?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!schoolId) return;
    try {
      const result = await trigger({ schoolId: Number(schoolId), offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setPaymentsList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getPaymentKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getPaymentKey(i)))];
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
    if (paymentsError) {
      Alert.alert("Error", paymentsError.message || "Failed to load payments");
    }
  }, [paymentsError]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (paymentsList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setPaymentsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (paymentsList.length === 0 && !isFetchingInitial && !initialData && schoolId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, schoolId]);

  const handleRefresh = async () => {
    if (isRefreshing || !schoolId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setPaymentsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !schoolId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleAddPayment = () => {
    router.push({
      pathname: "/screens/forms/addPayment",
      params: {
        schoolId,
        schoolName,
      },
    });
  };

  const getStatusColor = (status) => {
    return status ? "#10B981" : "#EF4444";
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return `Rs.${Number(amount)}`;
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.subTitle}>{schoolName || "School Payments"}</Text>
          </View>
          <Button
            title="Add Payment"
            onPress={handleAddPayment}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#F59E0B"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Payment List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Payment List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Payment Cards */}
        <FlatList
          data={paymentsList}
          keyExtractor={(payment) => String(payment.id)}
          renderItem={({ item: payment }) => (
            <View style={styles.card}>
              {/* Header with Status */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.cardTitle}>Payment - {payment.month || "N/A"}</Text>
                  <Text style={styles.cardSubtitle}>{payment.payment_Description || "No description"}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: payment.payment_Status ? "#D1FAE5" : "#FEE2E2" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(payment.payment_Status) },
                    ]}
                  >
                    {payment.payment_Status ? "Paid" : "Pending"}
                  </Text>
                </View>
              </View>

              {/* Payment Details */}
              <View style={styles.cardSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.cardLabel}>Payment Method</Text>
                    <Text style={styles.cardValue}>{payment.payment_Method || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.cardLabel}>Fee</Text>
                    <Text style={styles.cardValue}>{formatCurrency(payment.fee)}</Text>
                  </View>
                </View>
                {payment.remaining_Due !== null && payment.remaining_Due !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.cardLabel}>Remaining Due</Text>
                    <Text style={[styles.cardValue, styles.dueAmount]}>
                      {formatCurrency(payment.remaining_Due)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Created Date */}
              <View style={styles.cardDateRow}>
                <Text style={styles.dateText}>Created: {formatDate(payment.created_at)}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (paymentsList.length === 0 && !initialData)) &&
            !isRefreshing ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading payments...</Text>
              </View>
            ) : paymentsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No payments found. Create your first payment to get started.
                </Text>
                <Button
                  title="Add Payment"
                  onPress={handleAddPayment}
                  size="small"
                  bgColor="#F59E0B"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            paymentsList.length > 0 && !isRefreshing && isLoadingMore ? (
              <View style={styles.loadingFooter}>
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

export default payments;

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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-SemiBold",
  },
  cardSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#111827",
  },
  dueAmount: {
    color: "#EF4444",
    fontFamily: "Poppins-SemiBold",
  },
  cardDateRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  dateText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
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
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
});

