import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { hp } from "../helpers/common";

const StatsSection = () => {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

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

  const statsData = {
    admin: [
      {
        title: "School Count",
        value: "12",
        bg: "bg-blue-50",
        border: "border-blue-100",
        textColor: "text-blue-500",
        url: "/screens/schools",
      },
      {
        title: "Total Users",
        value: "254",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        textColor: "text-yellow-500",
      },
      {
        title: "Active Schools",
        value: "10",
        bg: "bg-green-50",
        border: "border-green-100",
        textColor: "text-green-500",
      },
      {
        title: "Owners",
        value: "2",
        bg: "bg-red-50",
        border: "border-red-100",
        textColor: "text-red-500",
        url: "/screens/owners"
      },
    ],
    owner: [
      {
        title: "Revenue This Month",
        value: "$45,200",
        bg: "bg-blue-50",
        border: "border-blue-100",
        textColor: "text-blue-500",
      },
      {
        title: "Total Branches",
        value: "8",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        textColor: "text-yellow-500",
      },
      {
        title: "Total Teachers",
        value: "156",
        bg: "bg-green-50",
        border: "border-green-100",
        textColor: "text-green-500",
      },
      {
        title: "Total Students",
        value: "2,847",
        bg: "bg-red-50",
        border: "border-red-100",
        textColor: "text-red-500",
      },
    ],

    specificBranch: [
      {
        title: "Revenue This Month",
        value: "$45,200",
        bg: "bg-blue-50",
        border: "border-blue-100",
        textColor: "text-blue-500",
      },
      {
        title: "Total Students",
        value: "450",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        textColor: "text-yellow-500",
      },
      {
        title: "Total Teachers",
        value: "156",
        bg: "bg-green-50",
        border: "border-green-100",
        textColor: "text-green-500",
      },
      {
        title: "Subscription Fee",
        value: "$2,847",
        bg: "bg-red-50",
        border: "border-red-100",
        textColor: "text-red-500",
      },
    ],

    principal: [
      {
        title: "Total Classes",
        value: "18",
        bg: "bg-blue-50",
        border: "border-blue-100",
        textColor: "text-blue-500",
        url: "/screens/(principal)/classes",
      },
      {
        title: "Total Students",
        value: "450",
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        textColor: "text-yellow-500",
        url: "/screens/(principal)/students",
      },
      {
        title: "Total Teachers",
        value: "28",
        bg: "bg-green-50",
        border: "border-green-100",
        textColor: "text-green-500",
        url: "/screens/(principal)/teachers",
      },
      {
        title: "Branch Name",
        value: "Downtown Branch",
        bg: "bg-red-50",
        border: "border-red-100",
        textColor: "text-red-500",
        url: "/screens/(principal)/branch",
      },
    ],
  };

  return (
    <View style={styles.container}>
      {statsData[user?.role]?.map((item, index) => (
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
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
});
