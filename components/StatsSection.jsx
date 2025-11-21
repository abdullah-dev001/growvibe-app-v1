import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { hp } from "../helpers/common";
import {
  useGetAdminDashboardQuery,
  useGetBranchDashboardForPrincipalQuery,
  useGetOwnerBranchDashboardQuery,
  useGetOwnerSchoolDashboardQuery,
} from "../redux/api/dashboardApi";

const StatsSection = () => {
  const { user, schoolId, branchId } = useSelector((state) => state.auth);
  const router = useRouter();

  // Fetch dashboard data based on role
  const {
    data: adminData,
    isLoading: isLoadingAdmin,
    error: adminError,
  } = useGetAdminDashboardQuery(undefined, {
    skip: user?.role !== "admin",
  });

  const {
    data: ownerSchoolData,
    isLoading: isLoadingOwnerSchool,
    error: ownerSchoolError,
  } = useGetOwnerSchoolDashboardQuery(
    { p_school_id: schoolId },
    {
      skip: user?.role !== "owner" || !schoolId || !!branchId,
    }
  );

  const {
    data: ownerBranchData,
    isLoading: isLoadingOwnerBranch,
    error: ownerBranchError,
  } = useGetOwnerBranchDashboardQuery(
    { p_branch_id: branchId },
    {
      skip: user?.role !== "owner" || !branchId,
    }
  );

  const {
    data: principalData,
    isLoading: isLoadingPrincipal,
    error: principalError,
  } = useGetBranchDashboardForPrincipalQuery(
    { p_branch_id: branchId },
    {
      skip: (user?.role !== "principal" && user?.role !== "coordinator") || !branchId,
    }
  );

  const getBgColor = (bgClass) => {
    const colorMap = {
      "bg-blue-50": "#EFF6FF",
      "bg-yellow-50": "#FEF3C7",
      "bg-green-50": "#D1FAE5",
      "bg-red-50": "#FEE2E2",
    };
    return colorMap[bgClass] || "#F9FAFB";
  };

  const getBorderColor = (borderClass) => {
    const colorMap = {
      "border-blue-100": "#DBEAFE",
      "border-yellow-100": "#FDE68A",
      "border-green-100": "#A7F3D0",
      "border-red-100": "#FECACA",
    };
    return colorMap[borderClass] || "#E5E7EB";
  };

  const getTextColor = (textClass) => {
    const colorMap = {
      "text-blue-500": "#3B82F6",
      "text-yellow-500": "#F59E0B",
      "text-green-500": "#10B981",
      "text-red-500": "#EF4444",
    };
    return colorMap[textClass] || "#6B7280";
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString("en-US");
  };

  // Format currency (without $ sign)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0";
    return Number(amount).toLocaleString("en-US");
  };

  // Format payment status
  const formatPaymentStatus = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Build stats data based on role and fetched data
  const statsData = useMemo(() => {
    // Admin stats
    if (user?.role === "admin" && adminData) {
      return [
          {
            title: "School Count",
          value: formatNumber(adminData.total_schools),
            bg: "bg-blue-50",
            border: "border-blue-100",
            textColor: "text-blue-500",
            url: "/screens/schools",
          },
          {
            title: "Total Users",
          value: formatNumber(adminData.total_users),
            bg: "bg-yellow-50",
            border: "border-yellow-100",
            textColor: "text-yellow-500",
          },
          {
            title: "Active Schools",
          value: formatNumber(adminData.active_schools),
            bg: "bg-green-50",
            border: "border-green-100",
            textColor: "text-green-500",
          },
          {
            title: "Owners",
          value: formatNumber(adminData.total_owners),
            bg: "bg-red-50",
            border: "border-red-100",
            textColor: "text-red-500",
          url: "/screens/owners",
          },
      ];
    }

    // Owner school stats (when no branch selected)
    if (user?.role === "owner" && ownerSchoolData && !branchId) {
      return [
          {
          title: "Subscription Fee",
          value: formatCurrency(ownerSchoolData.subscription_fee),
            bg: "bg-blue-50",
            border: "border-blue-100",
            textColor: "text-blue-500",
          },
          {
          title: "Payment Status",
          value: formatPaymentStatus(ownerSchoolData.payment_clear),
            bg: "bg-yellow-50",
            border: "border-yellow-100",
            textColor: "text-yellow-500",
          },
          {
            title: "Total Teachers",
          value: formatNumber(ownerSchoolData.total_teachers),
            bg: "bg-green-50",
            border: "border-green-100",
            textColor: "text-green-500",
          },
          {
            title: "Total Students",
          value: formatNumber(ownerSchoolData.total_students),
            bg: "bg-red-50",
            border: "border-red-100",
            textColor: "text-red-500",
          },
      ];
    }
    
    // Owner branch stats (when branch selected)
    if (user?.role === "owner" && ownerBranchData && branchId) {
      return [
          {
          title: "Monthly Revenue",
          value: formatCurrency(ownerBranchData.monthly_revenue),
            bg: "bg-blue-50",
            border: "border-blue-100",
            textColor: "text-blue-500",
          },
          {
            title: "Total Students",
          value: formatNumber(ownerBranchData.total_students),
            bg: "bg-yellow-50",
            border: "border-yellow-100",
            textColor: "text-yellow-500",
          },
          {
            title: "Total Teachers",
          value: formatNumber(ownerBranchData.total_teachers),
            bg: "bg-green-50",
            border: "border-green-100",
            textColor: "text-green-500",
          },
          {
            title: "Subscription Fee",
          value: formatCurrency(ownerBranchData.subscription_fee),
            bg: "bg-red-50",
            border: "border-red-100",
            textColor: "text-red-500",
          },
      ];
    }
    
    // Principal/Coordinator stats
    if ((user?.role === "principal" || user?.role === "coordinator") && principalData) {
      return [
          {
            title: "Total Classes",
          value: formatNumber(principalData.total_classes),
            bg: "bg-blue-50",
            border: "border-blue-100",
            textColor: "text-blue-500",
          url: "/screens/classes",
          },
          {
            title: "Total Students",
          value: formatNumber(principalData.total_students),
            bg: "bg-yellow-50",
            border: "border-yellow-100",
            textColor: "text-yellow-500",
          url: "/screens/students",
          },
          {
            title: "Total Teachers",
          value: formatNumber(principalData.total_teachers),
            bg: "bg-green-50",
            border: "border-green-100",
            textColor: "text-green-500",
          url: "/screens/teachers",
          },
          {
            title: "Branch Name",
          value: principalData.branch_name || "N/A",
            bg: "bg-red-50",
            border: "border-red-100",
            textColor: "text-red-500",
        },
      ];
    }

    // Return empty array if no data or loading
    return [];
  }, [
    user?.role,
    adminData,
    ownerSchoolData,
    ownerBranchData,
    principalData,
    branchId,
  ]);

  // Check loading state
  const isLoading =
    (user?.role === "admin" && isLoadingAdmin) ||
    (user?.role === "owner" && !branchId && isLoadingOwnerSchool) ||
    (user?.role === "owner" && branchId && isLoadingOwnerBranch) ||
    ((user?.role === "principal" || user?.role === "coordinator") && isLoadingPrincipal);

  // Get skeleton cards based on role
  const getSkeletonCards = () => {
    const skeletonCards = [];
    const cardCount = 4; // Always 4 cards

    for (let i = 0; i < cardCount; i++) {
      skeletonCards.push(
        <StatCardSkeleton
          key={`skeleton-${i}`}
          bg={i === 0 ? "bg-blue-50" : i === 1 ? "bg-yellow-50" : i === 2 ? "bg-green-50" : "bg-red-50"}
          border={i === 0 ? "border-blue-100" : i === 1 ? "border-yellow-100" : i === 2 ? "border-green-100" : "border-red-100"}
        />
      );
    }
    return skeletonCards;
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        {getSkeletonCards()}
      </View>
    );
  }

  // Show error or empty state
  if (!statsData || statsData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {statsData.map((item, index) => (
        <Pressable
          key={index}
          onPress={() =>
            item.url &&
            router.push({
              pathname: item.url,
              params: item.params,
            })
          }
          style={[
            styles.statCard,
            {
              backgroundColor: getBgColor(item.bg),
              borderColor: getBorderColor(item.border),
            },
          ]}
        >
          <Text
            style={[
              styles.statValue,
              {
                color: getTextColor(item.textColor),
                fontFamily: 'Poppins-SemiBold',
                fontSize: item?.title === "Branch Name" ? hp(1.6) : hp(3.4),
              },
            ]}
          >
            {item.value}
          </Text>
          <Text style={styles.statTitle}>
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

// Skeleton component for stat cards
const StatCardSkeleton = ({ bg, border }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getBgColor = (bgClass) => {
    const colorMap = {
      "bg-blue-50": "#EFF6FF",
      "bg-yellow-50": "#FEF3C7",
      "bg-green-50": "#D1FAE5",
      "bg-red-50": "#FEE2E2",
    };
    return colorMap[bgClass] || "#F9FAFB";
  };

  const getBorderColor = (borderClass) => {
    const colorMap = {
      "border-blue-100": "#DBEAFE",
      "border-yellow-100": "#FDE68A",
      "border-green-100": "#A7F3D0",
      "border-red-100": "#FECACA",
    };
    return colorMap[borderClass] || "#E5E7EB";
  };

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: getBgColor(bg),
          borderColor: getBorderColor(border),
        },
      ]}
    >
      <Animated.View
        style={[
          styles.skeletonValue,
          {
            opacity,
            backgroundColor: "#E5E7EB",
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonTitle,
          {
            opacity,
            backgroundColor: "#E5E7EB",
          },
        ]}
      />
    </View>
  );
};

export default StatsSection;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    width: '48%',
    borderWidth: 1,
    marginBottom: 16,
  },
  statValue: {
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  statTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  skeletonValue: {
    height: hp(3.4),
    width: '70%',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 18,
    width: '50%',
    borderRadius: 8,
    marginTop: 4,
  },
});
