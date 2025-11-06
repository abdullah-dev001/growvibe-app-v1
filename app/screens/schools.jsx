import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Plus from "../../assets/icons/Plus";
import Button from "../../components/Button";
import SchoolCard from "../../components/SchoolCard";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import SchoolCardSkeleton from "../../components/skeletons/SchoolCardSkeleton";
import { hp } from "../../helpers/common";
import { useGetSchoolsQuery } from "../../redux/api/schoolApi";

const school = () => {
  const router = useRouter()
  const { data: schools, isLoading, error } = useGetSchoolsQuery();
  if (error) {
    Alert.alert("Error", error.message);
  }

  const handleEdit = (school) => {
    // Navigate to edit screen or open modal
  };

  const handleDelete = (school) => {
    // Handle delete logic
  };

  const handleEditOwner = (school) => {
    // Navigate to edit owner screen
  };

  const handleViewPayments = (school) => {
    // Navigate to payments screen
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Schools
            </Text>
            <Text style={styles.subTitle}>
              Manage your schools here.
            </Text>
          </View>
          <Button
            title="Add School"
            onPress={() => router.push('/screens/forms/addSchool')}
            size="small"
            bgColor="#1CACF3"
            textColor="#FFFFFF"
            icon={<Plus size={hp(2.4)} color={"#FFFFFF"} strokeWidth={2} />}
          />
        </View>
        <SearchBar />
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            School List
          </Text>
          <View style={styles.listDivider} />
        </View>
        <ScrollView>
          <View style={styles.scrollContent}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <SchoolCardSkeleton key={index} />
              ))
            ) : schools && schools.length > 0 ? (
              schools.map((school) => (
                <SchoolCard
                  id={school.id}
                  key={school.id}
                  school_Name={school.school_Name}
                  school_Address={school.school_Address}
                  school_Contact={school.school_Contact}
                  school_Status={school.school_Status}
                  school_Subscription_Fee={school.total_subscription_fee}
                  created_at={school.created_at}
                  owner_Email={school.owner_email}
                  total_Users={school.total_users}
                  onEdit={() => handleEdit(school)}
                  onDelete={() => handleDelete(school)}
                  onEditOwner={() => handleEditOwner(school)}
                  onViewPayments={() => handleViewPayments(school)}
                  onViewBranches={() =>
                    router.push({
                      pathname: "/screens/branches",
                      params: {
                        schoolId: school.id,
                        schoolName: school.school_Name,
                      },
                    })
                  }
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No schools found. Create your first school to get started.
                </Text>
                <Button
                  title="Add School"
                  onPress={() => router.push('/screens/forms/addSchool')}
                  size="small"
                  bgColor="#1CACF3"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default school;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: hp(3.4),
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  subTitle: {
    color: "#6B7280",
    fontSize: hp(1.6),
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
