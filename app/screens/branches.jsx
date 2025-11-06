import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import Plus from "../../assets/icons/Plus";
import BranchCard from "../../components/BranchCard";
import Button from "../../components/Button";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import BranchCardSkeleton from "../../components/skeletons/branchCardSkeleton";
import { hp } from "../../helpers/common";
import { useGetBranchesBySchoolQuery } from "../../redux/api/branchApi";

const Branches = () => {
  const { schoolId, schoolName } = useLocalSearchParams();
  const { sessionRestored } = useSelector((state) => state.auth);
  const router = useRouter();

  const handleEdit = (branch) => {
    // Navigate to edit screen or open modal
  };

  const handleDelete = (branch) => {
    // Handle delete logic
  };

  const handleAddBranch = () => {
    router.push({
      pathname: "/screens/forms/addBranch",
      params: { schoolId, schoolName },
    });
  };

  // Ensure numeric schoolId and wait for session restoration
  const numericSchoolId = schoolId ? parseInt(schoolId, 10) : undefined;
  const { data: branches, isLoading, error } = useGetBranchesBySchoolQuery(
    numericSchoolId,
    {
      skip: !sessionRestored || !numericSchoolId,
    }
  );

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
        <SearchBar />

        {/* Branch List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Branch List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Branch Cards */}
        <ScrollView>
          <View style={styles.scrollContent}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <BranchCardSkeleton key={index} />
              ))
            ) : error ? (
              <Text style={styles.errorText}>
                Error loading branches: {error.message}
              </Text>
            ) : branches && branches.length > 0 ? (
              branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch_Name={branch.branch_Name}
                  branch_Address={branch.branch_Address}
                  branch_Contact={branch.branch_Contact}
                  branch_Status={branch.branch_Status}
                  branch_Subscription_Fee={branch.branch_Subscription_Fee}
                  created_at={branch.created_at}
                  onEdit={() => handleEdit(branch)}
                  onDelete={() => handleDelete(branch)}
                />
              ))
            ) : (
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
            )}
          </View>
        </ScrollView>
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
    flex: 1,
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
