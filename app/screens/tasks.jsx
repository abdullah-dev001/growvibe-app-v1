import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../assets/icons/Plus";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import { hp } from "../../helpers/common";
import { useGetTasksPaginatedQuery, useLazyGetTasksPaginatedQuery, useUpdateTaskStatusMutation } from "../../redux/api/taskApi";

const PAGE_SIZE = 5;

const tasks = () => {
  const router = useRouter();
  const { user, schoolId, branchId } = useSelector((state) => state.auth);

  const role = user?.role;
  const authId = user?.id;

  const [activeTab, setActiveTab] = useState("my");
  const [tasksList, setTasksList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const buildFilters = () => {
    const base = {
      school_Id: schoolId || null,
      branch_Id: branchId || null,
      created_By: null,
      assigned_To: null,
    };

    if (!role || !authId) return base;

    // Admin has no access
    if (role === "admin") return base;

    // Owner: only tasks they created (assigned to someone)
    if (role === "owner") {
      return { ...base, created_By: authId };
    }

    // Principal, coordinator, teacher: My Tasks / Assigned to Me
    if (role === "principal" || role === "coordinator" || role === "teacher") {
      if (activeTab === "my") {
        return { ...base, created_By: authId };
      }
      return { ...base, assigned_To: authId };
    }

    // Student: only tasks assigned to them
    if (role === "student") {
      return { ...base, assigned_To: authId };
    }

    return base;
  };

  const filters = buildFilters();

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetTasksPaginatedQuery(
    {
      ...filters,
      offset: 0,
      limit: PAGE_SIZE,
    },
    {
      skip: !authId || !role || role === "admin",
      refetchOnMountOrArgChange: false,
    }
  );

  const [trigger, { isFetching, error: tasksError }] = useLazyGetTasksPaginatedQuery();
  const [updateStatus] = useUpdateTaskStatusMutation();

  const getTaskKey = (t) => String(t?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!authId || !role || role === "admin") return;
    try {
      const result = await trigger({
        ...filters,
        offset: nextOffset,
        limit: PAGE_SIZE,
      }).unwrap();
      const items = result?.items || [];

      setTasksList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getTaskKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getTaskKey(i)))];
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
    if (tasksError) {
      Alert.alert("Error", tasksError.message || "Failed to load tasks");
    }
  }, [tasksError]);

  useEffect(() => {
    // When filters change, use cached data if available
    if (initialData?.items) {
      const items = initialData.items;
      setTasksList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (!isFetchingInitial && authId && role && role !== "admin") {
      setTasksList([]);
      setOffset(0);
      setHasMore(true);
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, authId, role, activeTab, schoolId, branchId]);

  const handleRefresh = async () => {
    if (isRefreshing || !authId || !role || role === "admin") return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setTasksList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !authId || !role || role === "admin") return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleAddTask = () => {
    // Admin and student cannot create tasks
    if (role === "admin" || role === "student") return;
    router.push("/screens/forms/addTask");
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateStatus({ id: task.id, status: newStatus }).unwrap();
    } catch (e) {
      Alert.alert("Error", e?.data?.message || e?.message || "Failed to update task status");
    }
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

  const renderPriority = (priority) => {
    const value = (priority || "").toLowerCase();
    if (!value) return "Medium";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const canUpdateStatus = (task) => {
    if (!role || !authId) return false;
    if (role === "admin") return false;
    // Creator can always update
    if (task?.created_By === authId) return true;
    // Assignee can update too
    if (task?.assigned_To === authId) return true;
    return false;
  };

  const renderTabSwitcher = () => {
    const showTabs =
      role === "principal" || role === "coordinator" || role === "teacher";

    if (!showTabs) return null;

    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("my")}
            style={[
              styles.tabButton,
              activeTab === "my" ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "my" ? "#F59E0B" : "#6B7280" },
              ]}
            >
              My Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("assigned")}
            style={[
              styles.tabButton,
              activeTab === "assigned" ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "assigned" ? "#F59E0B" : "#6B7280" },
              ]}
            >
              Assigned to Me
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Admin has no access: show message
  if (role === "admin") {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.subTitle}>
            Admin role does not have access to task management.
          </Text>
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
            <Text style={styles.headerTitle}>Tasks</Text>
            <Text style={styles.subTitle}>
              {role === "student"
                ? "View tasks assigned to you"
                : "Create and manage tasks"}
            </Text>
          </View>
          {role !== "admin" && role !== "student" && (
            <Button
              title="Add Task"
              onPress={handleAddTask}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#1CACF3"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Tabs */}
        {renderTabSwitcher()}

        {/* List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Task List</Text>
          <View style={styles.listDivider} />
        </View>

        <FlatList
          data={tasksList}
          keyExtractor={(task) => String(task.id)}
          renderItem={({ item: task }) => (
            <View style={styles.card}>
              {/* Header with title and status */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.cardTitle}>{task.title || "Untitled Task"}</Text>
                  <Text style={styles.cardSubtitle}>
                    Created by: {task.created_by_name || "Unknown creator"}
                  </Text>
                  {task.created_by_email && (
                    <Text style={styles.cardEmail}>
                      {task.created_by_email}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        task.status === "resolved"
                          ? "#D1FAE5"
                          : "#FEF3C7",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {task.status === "resolved" ? "Resolved" : "Pending"}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Description</Text>
                <Text style={styles.cardValue}>
                  {task.description || "No description provided."}
                </Text>
              </View>

              {/* Priority */}
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Priority</Text>
                <Text style={styles.cardValue}>{renderPriority(task.priority)}</Text>
              </View>

              {/* Assigned To */}
              {task.assigned_To_Name && (
                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>Assigned To</Text>
                  <Text style={styles.cardValue}>
                    {task.assigned_To_Name}
                  </Text>
                </View>
              )}

              {/* Created Date */}
              <View style={styles.cardDateRow}>
                <Text style={styles.dateText}>
                  Created: {formatDate(task.created_at)}
                </Text>
              </View>

              {/* Status actions for creator/assignee */}
              {canUpdateStatus(task) && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(task, "pending")}
                    style={styles.statusActionButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statusActionText}>Mark Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(task, "resolved")}
                    style={[styles.statusActionButton, { marginLeft: 8, backgroundColor: "#D1FAE5" }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusActionText, { color: "#10B981" }]}>
                      Mark Resolved
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (isFetchingInitial || isFetching || (tasksList.length === 0 && !initialData)) &&
            !isRefreshing ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading tasks...</Text>
              </View>
            ) : tasksList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {role === "student"
                    ? "No tasks have been assigned to you yet."
                    : activeTab === "assigned"
                    ? "No task assigned to you."
                    : "No tasks found. Create your first task to get started."}
                </Text>
                {role !== "admin" && role !== "student" && activeTab === "my" && (
                  <Button
                    title="Add Task"
                    onPress={handleAddTask}
                    size="small"
                    bgColor="#1CACF3"
                    textColor="#FFFFFF"
                    icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                  />
                )}
              </View>
            ) : null
          }
          ListFooterComponent={
            tasksList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default tasks;

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
  tabContainer: {
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    marginTop: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonInactive: {
    backgroundColor: "transparent",
  },
  tabButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-SemiBold",
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
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  cardEmail: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
    marginTop: 2,
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
  cardActions: {
    flexDirection: "row",
    marginTop: 12,
  },
  statusActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
  },
  statusActionText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-SemiBold",
    color: "#F59E0B",
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


