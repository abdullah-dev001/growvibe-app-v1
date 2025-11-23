import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Pen from "../../assets/icons/Pen";
import Plus from "../../assets/icons/Plus";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import SessionCardSkeleton from "../../components/skeletons/SessionCardSkeleton";
import { hp } from "../../helpers/common";
import { useGetSessionsByBranchIdPaginatedQuery, useLazyGetSessionsByBranchIdPaginatedQuery } from "../../redux/api/sessionApi";

const sessions = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);

  const PAGE_SIZE = 5;
  const [sessionsList, setSessionsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetSessionsByBranchIdPaginatedQuery(
    { branchId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: sessionsError }] = useLazyGetSessionsByBranchIdPaginatedQuery();

  const getSessionKey = (s) => String(s?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setSessionsList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getSessionKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getSessionKey(i)))];
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
    if (sessionsError) {
      Alert.alert("Error", sessionsError.message || "Failed to load sessions");
    }
  }, [sessionsError]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sessionsList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setSessionsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (sessionsList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId]);

  // Sync local state with updated cache data when cache is invalidated (e.g., after edit)
  useEffect(() => {
    if (initialData?.items && !isFetchingInitial) {
      // Always sync if we're on the first page (offset <= PAGE_SIZE)
      // This ensures updates are reflected when coming back from edit
      if (offset <= PAGE_SIZE) {
        setSessionsList(initialData.items);
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
      setSessionsList(items);
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

  const handleEdit = (session) => {
    router.push({
      pathname: '/screens/forms/addSession',
      params: {
        sessionId: session.id,
      },
    });
  };


  const handleAddSession = () => {
    router.push("/screens/forms/addSession");
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

  const getSessionDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return `${months} months`;
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Sessions
            </Text>
            <Text style={styles.subTitle}>
              Manage academic sessions
            </Text>
          </View>
          <Button
            title="Add Session"
            onPress={handleAddSession}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#10B981"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Session List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Session List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Session Cards */}
        <FlatList
          data={sessionsList}
          keyExtractor={(session) => String(session.id)}
          renderItem={({ item: session }) => (
                <View
                  key={session.id}
                  style={styles.card}
                >
                  {/* Header with Session Name and Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        {session.session_Name}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Duration:{" "}
                        {getSessionDuration(
                          session.session_Start,
                          session.session_End
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: session.session_Status ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(session.session_Status) }
                        ]}
                      >
                        {session.session_Status ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* Session Dates */}
                  <View style={styles.cardSection}>
                    <View style={styles.datesRow}>
                      <View style={styles.dateItem}>
                        <Text style={styles.cardLabel}>
                          Start Date
                        </Text>
                        <Text style={styles.dateValue}>
                          {formatDate(session.session_Start)}
                        </Text>
                      </View>
                      <View style={[styles.dateItem, styles.dateItemRight]}>
                        <Text style={styles.cardLabel}>
                          End Date
                        </Text>
                        <Text style={styles.dateValue}>
                          {formatDate(session.session_End)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Primary Actions */}
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(session)}
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
            (showSkeleton || isFetchingInitial || isFetching || (sessionsList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SessionCardSkeleton key={index} />
                ))}
              </>
            ) : sessionsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No sessions found. Create your first session to get started.
                </Text>
                <Button
                  title="Add Session"
                  onPress={handleAddSession}
                  size="small"
                  bgColor="#10B981"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            sessionsList.length > 0 && !isRefreshing && isLoadingMore ? (
              <SessionCardSkeleton />
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

export default sessions;

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
    fontFamily: 'Poppins-Medium',
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
  cardSection: {
    marginBottom: 16,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateItemRight: {
    marginLeft: 16,
  },
  cardLabel: {
    fontSize: hp(1.2),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    marginBottom: hp(0.3),
  },
  dateValue: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#111827",
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
