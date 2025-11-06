import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { hp } from "../helpers/common";
import { useGetBranchesBySchoolQuery } from "../redux/api/branchApi";
import { useGetSchoolsByOwnerQuery } from "../redux/api/schoolApi";
import { useGetSessionsByBranchIdQuery } from "../redux/api/sessionApi";
import {
  clearBranchId,
  clearSessionId,
  setBranchId,
  setSchoolId,
  setSessionId,
} from "../redux/slices/authSlice";

const BranchSelectorSection = () => {
  const dispatch = useDispatch();
  const { user, schoolId, branchId, sessionId } = useSelector((state) => state.auth);

  const { data: school, isLoading: isSchoolLoading } =
    useGetSchoolsByOwnerQuery(user?.id, {
      skip: user?.role !== "owner" || !user?.id,
    });

  const currentSchoolId = useMemo(() => school?.[0]?.id, [school]);

  // Set schoolId in Redux when school data is loaded
  React.useEffect(() => {
    if (currentSchoolId && currentSchoolId !== schoolId) {
      dispatch(setSchoolId(currentSchoolId));
    }
  }, [currentSchoolId, schoolId, dispatch]);

  const { data: branches, isLoading: isBranchesLoading } =
    useGetBranchesBySchoolQuery(currentSchoolId, {
      skip: !currentSchoolId || user?.role !== "owner" || isSchoolLoading,
    });

  const handleBranchSelection = (nextBranchId) => {
    // Always clear current session when switching branches
    dispatch(clearSessionId());
    if (nextBranchId === "entire-school") {
      dispatch(clearBranchId());
    } else {
      dispatch(setBranchId(nextBranchId));
    }
  };

  // Fetch sessions for selected branch
  const { data: sessions, isLoading: isSessionsLoading } = useGetSessionsByBranchIdQuery(branchId, {
    skip: !branchId,
  });

  // Default select first session when sessions for the current branch load
  React.useEffect(() => {
    if (!branchId) return; // only when a branch is selected
    if (!sessions || sessions.length === 0) return; // wait for sessions

    // Ensure the sessions belong to the currently selected branch to avoid stale data
    const sessionsMatchBranch = sessions.every((s) => s.branch_Id === branchId);
    if (!sessionsMatchBranch) return;

    // If current sessionId is not one of the sessions for this branch, pick the first
    const hasCurrent = sessions.some((s) => s.id === sessionId);
    if (!hasCurrent) {
      dispatch(setSessionId(sessions[0].id));
    }
  }, [branchId, sessions, sessionId, dispatch]);

  return (
    <>
      {/* Branch Selection Section */}
      {isBranchesLoading || isSchoolLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1CACF3" />
          <Text style={styles.loadingText}>Loading branches...</Text>
        </View>
      ) : (
        <>
          {user?.role === "owner" && branches && branches.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Select Branch
              </Text>

              {isBranchesLoading ? (
                <ActivityIndicator size="small" color="#1CACF3" />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollView}
                >
                  <View style={styles.branchesRow}>
                    {/* Entire School Option */}
                    <Pressable
                      onPress={() => handleBranchSelection("entire-school")}
                      style={[
                        styles.branchCard,
                        !branchId ? styles.branchCardActive : styles.branchCardInactive,
                      ]}
                    >
                      <View style={styles.branchCardHeader}>
                        <Text
                          style={[
                            styles.branchCardTitle,
                            { color: !branchId ? "#1CACF3" : "#6B7280" },
                          ]}
                        >
                          Entire School
                        </Text>
                        <View
                          style={[
                            styles.branchCardBadge,
                            !branchId ? styles.badgeActive : styles.badgeInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: !branchId ? "#1CACF3" : "#6B7280" },
                            ]}
                          >
                            Active
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.branchCardSubtitle}>
                        All branches
                      </Text>
                    </Pressable>

                    {/* Individual Branch Options */}
                    {branches.map((branch) => (
                      <Pressable
                        key={branch.id}
                        onPress={() => handleBranchSelection(branch.id)}
                        style={[
                          styles.branchCard,
                          branchId === branch.id ? styles.branchCardActive : styles.branchCardInactive,
                        ]}
                      >
                        <View style={styles.branchCardHeader}>
                          <Text
                            style={[
                              styles.branchCardTitle,
                              { color: branchId === branch.id ? "#1CACF3" : "#6B7280" },
                            ]}
                            numberOfLines={1}
                          >
                            {branch.branch_Name}
                          </Text>
                          <View
                            style={[
                              styles.branchCardBadge,
                              branch.branch_Status ? styles.badgeGreen : styles.badgeRed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                { color: branch.branch_Status ? "#10B981" : "#EF4444" },
                              ]}
                            >
                              {branch.branch_Status ? "Active" : "Inactive"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.branchCardSubtitle} numberOfLines={2}>
                          {branch.branch_Address}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No branches found</Text>
            </View>
          )}
        </>
      )}

      {/* Session Selection Section - visible only when a branch is selected */}
      {branchId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Session
          </Text>

          {isSessionsLoading ? (
            <ActivityIndicator size="small" color="#1CACF3" />
          ) : sessions && sessions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
              <View style={styles.sessionsRow}>
                {sessions.map((session) => (
                  <Pressable
                    key={session.id}
                    onPress={() => dispatch(setSessionId(session.id))}
                    style={[
                      styles.sessionCard,
                      sessionId === session.id ? styles.sessionCardActive : styles.sessionCardInactive,
                    ]}
                  >
                    <View style={styles.sessionCardHeader}>
                      <Text
                        style={[
                          styles.sessionCardTitle,
                          { color: sessionId === session.id ? "#10B981" : "#6B7280" },
                        ]}
                        numberOfLines={1}
                      >
                        {session.session_Name}
                      </Text>
                      <View
                        style={[
                          styles.sessionCardBadge,
                          session.session_Status ? styles.badgeGreen : styles.badgeRed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: session.session_Status ? "#10B981" : "#EF4444" },
                          ]}
                        >
                          {session.session_Status ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sessionCardSubtitle}>
                      {new Date(session.session_Start).toLocaleDateString()} - {new Date(session.session_End).toLocaleDateString()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No sessions found</Text>
          )}
        </View>
      )}
    </>
  );
};

export default BranchSelectorSection;

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: hp(1.5),
  },
  scrollView: {
    marginBottom: 16,
  },
  branchesRow: {
    flexDirection: 'row',
  },
  sessionsRow: {
    flexDirection: 'row',
  },
  branchCard: {
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    borderWidth: 2,
    marginRight: 12,
  },
  branchCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  branchCardInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  branchCardTitle: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Bold",
    marginBottom: hp(0.5),
    flex: 1,
  },
  branchCardBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#DBEAFE',
  },
  badgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: hp(1.1),
    fontFamily: "Poppins-Medium",
  },
  branchCardSubtitle: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    borderWidth: 2,
    marginRight: 12,
  },
  sessionCardActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  sessionCardInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCardTitle: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Bold",
    marginBottom: hp(0.5),
    flex: 1,
  },
  sessionCardBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  sessionCardSubtitle: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#6B7280',
  },
});
