import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Pen from "../../assets/icons/Pen";
import Plus from "../../assets/icons/Plus";
import Trash from "../../assets/icons/Trash";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import CoordinatorCardSkeleton from "../../components/skeletons/CoordinatorCardSkeleton";
import { hp } from "../../helpers/common";
import { useGetCoordinatorsByBranchPaginatedQuery, useLazyGetCoordinatorsByBranchPaginatedQuery } from "../../redux/api/coordinator";

const coordinators = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);

  const PAGE_SIZE = 5;
  const [coordinatorsList, setCoordinatorsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetCoordinatorsByBranchPaginatedQuery(
    { branchId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: coordinatorsError }] = useLazyGetCoordinatorsByBranchPaginatedQuery();

  const getCoordinatorKey = (c) => String(c?.auth_User_Id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setCoordinatorsList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getCoordinatorKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getCoordinatorKey(i)))];
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
    if (coordinatorsError) {
      Alert.alert("Error", coordinatorsError.message || "Failed to load coordinators");
    }
  }, [coordinatorsError]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (coordinatorsList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setCoordinatorsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (coordinatorsList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setCoordinatorsList(items);
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
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleEdit = (coordinator) => {
    // Navigate to edit screen or open modal
  };

  const handleDelete = (coordinator) => {
    Alert.alert(
      "Delete Coordinator",
      `Are you sure you want to delete "${coordinator.full_Name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Handle delete logic
          },
        },
      ]
    );
  };

  const handleAddCoordinator = () => {
    router.push("/screens/forms/addCoordinator");
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Coordinators
            </Text>
            <Text style={styles.subTitle}>
              Manage school coordinators
            </Text>
          </View>
          {coordinatorsList?.length < 1 && (
            <Button
              title="Add Coordinator"
              onPress={handleAddCoordinator}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#EC4899"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Coordinator List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Coordinator List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Coordinator Cards */}
        <FlatList
          data={coordinatorsList}
          keyExtractor={(coordinator) => String(coordinator.auth_User_Id)}
          renderItem={({ item: coordinator }) => (
                <View
                  key={coordinator.auth_User_Id}
                  style={styles.card}
                >
                  {/* Header with Image, Name and Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar} />
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        {coordinator.full_Name}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {coordinator.email}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: coordinator.profile_Status ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(coordinator.profile_Status) }
                        ]}
                      >
                        {coordinator.profile_Status ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* Coordinator Details */}
                  <View style={styles.cardSection}>
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Contact
                      </Text>
                      <Text style={styles.cardValue}>
                        {coordinator.phone || "Not assigned yet..."}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <View style={styles.cardDateRow}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        Created: {formatDate(coordinator.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Primary Actions */}
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(coordinator)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
                        <Text style={styles.editButtonText}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(coordinator)}
                        style={[styles.deleteButton, { marginLeft: 8 }]}
                        activeOpacity={0.7}
                      >
                        <Trash size={hp(1.6)} color="#EF4444" strokeWidth={2} />
                        <Text style={styles.deleteButtonText}>
                          Delete
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
            (isFetchingInitial || isFetching || (coordinatorsList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <CoordinatorCardSkeleton key={index} />
                ))}
              </>
            ) : coordinatorsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No coordinators found. Create your first coordinator to get started.
                </Text>
                <Button
                  title="Add Coordinator"
                  onPress={handleAddCoordinator}
                  size="small"
                  bgColor="#EC4899"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            coordinatorsList.length > 0 && !isRefreshing && isLoadingMore ? (
              <CoordinatorCardSkeleton />
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

export default coordinators;

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
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: "Poppins-Bold",
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
  cardSection: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: hp(1.2),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(0.3),
  },
  cardValue: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#111827",
  },
  cardDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  cardActions: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  primaryActions: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#1CACF3",
    marginLeft: hp(0.5),
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#EF4444",
    marginLeft: hp(0.5),
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
});
