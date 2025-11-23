import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../assets/icons/Plus";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import { hp } from "../../helpers/common";
import { useGetApplicationsPaginatedQuery, useLazyGetApplicationsPaginatedQuery, useUpdateApplicationStatusMutation } from "../../redux/api/applicationApi";
import { supabase } from "../../supabaseClient";

const PAGE_SIZE = 5;

// Component for attachment preview with signed URL download only (no inline preview)
const AttachmentPreview = ({ attachmentUrl, onDownload }) => {
  const fileName = attachmentUrl.split("/").pop() || "attachment";
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPress = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload(attachmentUrl, fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.cardSection}>
      <Text style={styles.cardLabel}>Attachment</Text>
      <View style={styles.filePreviewBox}>
        <Text style={styles.fileIcon}>📎</Text>
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.attachmentButton}
        onPress={handleDownloadPress}
        activeOpacity={0.7}
        disabled={isDownloading}
      >
        {isDownloading && (
          <ActivityIndicator
            size="small"
            color="#2563EB"
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={styles.attachmentText}>
          {isDownloading ? "Downloading..." : "Download Attachment"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const applications = () => {
  const router = useRouter();
  const { initialTab } = useLocalSearchParams();
  const { user, schoolId, branchId, classId } = useSelector((state) => state.auth);

  const role = user?.role;
  const authId = user?.id;

  const [activeTab, setActiveTab] = useState(initialTab === "assigned" ? "assigned" : "my");
  const [applicationsList, setApplicationsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  // Simple in-memory cache for downloaded attachments: { [cacheKey]: localUri }
  const [downloadCache, setDownloadCache] = useState({});

  const buildFilters = () => {
    // Principal and coordinator don't have branch_Id in their profiles, so only use school_Id
    const base = {
      school_Id: schoolId || null,
      branch_Id: (role === "principal" || role === "coordinator") ? null : (branchId || null),
      created_By: null,
      assigned_To: null,
    };

    if (role === "owner") {
      // Owner: only assigned to me (principal applications)
      return { ...base, assigned_To: authId };
    }

    if (role === "principal" || role === "coordinator" || role === "teacher") {
      if (activeTab === "my") {
        return { ...base, created_By: authId };
      }
      // assigned to me
      return { ...base, assigned_To: authId };
    }

    if (role === "student") {
      // Student: only own applications
      return { ...base, created_By: authId };
    }

    // Default: no data
    return base;
  };

  const filters = buildFilters();

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetApplicationsPaginatedQuery(
    {
      ...filters,
      offset: 0,
      limit: PAGE_SIZE,
    },
    {
      skip: !authId || !role,
      // Don't refetch if we have cached data (for tab switching)
      refetchOnMountOrArgChange: false,
    }
  );

  const [trigger, { isFetching, error: applicationsError }] = useLazyGetApplicationsPaginatedQuery();
  const [updateStatus] = useUpdateApplicationStatusMutation();

  const getApplicationKey = (a) => String(a?.id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!authId || !role) return;
    try {
      const result = await trigger({
        ...filters,
        offset: nextOffset,
        limit: PAGE_SIZE,
      }).unwrap();
      const items = result?.items || [];

      setApplicationsList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getApplicationKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getApplicationKey(i)))];
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
    if (applicationsError) {
      Alert.alert("Error", applicationsError.message || "Failed to load applications");
    }
  }, [applicationsError]);

  useEffect(() => {
    // Reset loaded flag when filters change
    setHasLoadedInitial(false);
  }, [activeTab, role, schoolId, branchId]);

  useEffect(() => {
    // Skip if already loaded or currently fetching
    if (hasLoadedInitial || isFetchingInitial) return;
    
    // When filters change, check if we have cached data first
    if (initialData !== undefined) {
      // Use cached data from RTK Query (even if empty array)
      const items = initialData.items || [];
      setApplicationsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
      setHasLoadedInitial(true);
    } else if (authId && role) {
      // No cached data, fetch once
      setApplicationsList([]);
      setOffset(0);
      setHasMore(true);
      setHasLoadedInitial(true);
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, authId, role, hasLoadedInitial]);

  const handleRefresh = async () => {
    if (isRefreshing || !authId || !role) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setApplicationsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !authId || !role) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleAddApplication = () => {
    // Owner cannot create applications
    if (role === "owner") return;
    router.push("/screens/forms/addApplication");
  };

  const handleStatusChange = async (application, newStatus) => {
    try {
      // Optimistically update local state for immediate UI feedback
      setApplicationsList((prev) =>
        prev.map((app) =>
          app.id === application.id ? { ...app, status: newStatus } : app
        )
      );

      await updateStatus({ 
        id: application.id, 
        status: newStatus,
        updatedBy: authId // Pass the current user ID who is updating the status
      }).unwrap();
      
      // Refresh the local list with fresh data from server
      setOffset(0);
      setHasMore(true);
      await loadPage(0, true);
      
      // Also refetch the initial query to ensure cache is updated
      await refetch();
    } catch (e) {
      // Revert optimistic update on error
      setApplicationsList((prev) =>
        prev.map((app) =>
          app.id === application.id ? { ...app, status: application.status } : app
        )
      );
      Alert.alert("Error", e?.data?.message || e?.message || "Failed to update status");
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

  // Check if current user can update status (if application is assigned to them)
  const canUpdateStatus = (application) => {
    // Owner can update principal applications
    if (role === "owner") return true;
    // Other roles can update applications assigned to them
    return application?.assigned_To === authId;
  };

  const renderStatus = (status) => {
    const label = status || "pending";
    if (label === "approved") return "Approved";
    if (label === "reject") return "Rejected";
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  // Extract file path from Supabase storage URL
  const extractFilePath = (url) => {
    if (!url) return null;
    // Supabase storage URLs typically look like:
    // https://[project].supabase.co/storage/v1/object/public/application-docs/school37/branch26/application-123.pdf
    // or signed URLs
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.indexOf("application-docs");
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Get everything after "application-docs"
        return pathParts.slice(bucketIndex + 1).join("/");
      }
      // Fallback: try to extract from the end of the URL
      const match = url.match(/application-docs\/(.+)$/);
      if (match) return match[1];
      return null;
    } catch {
      // If URL parsing fails, try regex extraction
      const match = url.match(/application-docs\/(.+)$/);
      return match ? match[1] : null;
    }
  };

  const handleDownload = async (attachmentUrl, fileName) => {
    try {
      // Use attachmentUrl as cache key (stable per attachment)
      const cacheKey = attachmentUrl;

      // 1. If we already downloaded this file, reuse the local URI
      const cachedUri = downloadCache[cacheKey];
      if (cachedUri) {
        const info = await FileSystem.getInfoAsync(cachedUri);
        if (info.exists) {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(cachedUri);
          } else {
            await Linking.openURL(cachedUri);
          }
          return;
        }
      }

      // 2. Extract file path from URL for Supabase
      const filePath = extractFilePath(attachmentUrl);
      
      if (!filePath) {
        Alert.alert("Error", "Could not extract file path from URL");
        return;
      }

      // 3. Get signed URL from Supabase (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from("application-docs")
        .createSignedUrl(filePath, 3600);

      if (error) {
        Alert.alert("Error", error.message || "Failed to generate download link");
        return;
      }

      const signedUrl = data.signedUrl;
      if (!signedUrl) {
        Alert.alert("Error", "Failed to get download URL");
        return;
      }

      // 4. Download file to local storage
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(signedUrl, fileUri);

      if (!downloadResult || !downloadResult.uri) {
        Alert.alert("Error", "Failed to download file");
        return;
      }

      // Cache the local URI for next time
      setDownloadCache((prev) => ({
        ...prev,
        [cacheKey]: downloadResult.uri,
      }));

      // 5. Share/open the downloaded file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        // Fallback: try to open with Linking
        await Linking.openURL(downloadResult.uri);
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to download file");
    }
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
              My Applications
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Applications</Text>
            <Text style={styles.subTitle}>
              {role === "student"
                ? "Create and track your applications"
                : "Manage and track applications"}
            </Text>
          </View>
          {role !== "owner" && (
            <Button
              title="Add Application"
              onPress={handleAddApplication}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#F59E0B"
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
          <Text style={styles.listTitle}>Application List</Text>
          <View style={styles.listDivider} />
        </View>

        <FlatList
          data={applicationsList}
          keyExtractor={(application) => String(application.id)}
          renderItem={({ item: application }) => (
            <View style={styles.card}>
              {/* Header with title and status */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.cardTitle}>{application.title || "Untitled Application"}</Text>
                  <Text style={styles.cardSubtitle}>
                    {application.created_by_name || "Unknown creator"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        application.status === "approved"
                          ? "#D1FAE5"
                          : application.status === "reject"
                          ? "#FEE2E2"
                          : "#FEF3C7",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{renderStatus(application.status)}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.cardSection}>
                <Text style={styles.cardLabel}>Description</Text>
                <Text style={styles.cardValue}>
                  {application.description || "No description provided."}
                </Text>
              </View>

              {/* Attachment */}
              {application.attachment_Url && (
                <AttachmentPreview
                  attachmentUrl={application.attachment_Url}
                  onDownload={handleDownload}
                  extractFilePath={extractFilePath}
                />
              )}

              {/* Created Date */}
              <View style={styles.cardDateRow}>
                <Text style={styles.dateText}>
                  Created: {formatDate(application.created_at)}
                </Text>
              </View>

              {/* Status actions - for applications assigned to current user */}
              {canUpdateStatus(application) && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(application, "approved")}
                    style={[styles.statusActionButton, { backgroundColor: "#D1FAE5" }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusActionText, { color: "#10B981" }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(application, "reject")}
                    style={[styles.statusActionButton, { marginLeft: 8, backgroundColor: "#FEE2E2" }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusActionText, { color: "#DC2626" }]}>Reject</Text>
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
            (isFetchingInitial || isFetching || (applicationsList.length === 0 && !initialData)) &&
            !isRefreshing ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading applications...</Text>
              </View>
            ) : applicationsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {activeTab === "assigned"
                    ? "No applications are currently assigned to you."
                    : "No applications found. Create your first application to get started."}
                </Text>
                {role !== "owner" && activeTab === "my" && (
                  <Button
                    title="Add Application"
                    onPress={handleAddApplication}
                    size="small"
                    bgColor="#F59E0B"
                    textColor="#FFFFFF"
                    icon={<Plus size={hp(2)} color={"#FFFFFF"} strokeWidth={2} />}
                  />
                )}
              </View>
            ) : null
          }
          ListFooterComponent={
            applicationsList.length > 0 && !isRefreshing && isLoadingMore ? (
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

export default applications;

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
  imagePreviewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  filePreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#111827",
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
  },
  attachmentText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#2563EB",
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


