import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSelector } from "react-redux";
import { hp } from "../helpers/common";
import BranchSelectorSection from "./BranchSelectorSection";
import StatsSection from "./StatsSection";
import Topbar from "./Topbar";

// Dashboard options configuration
const DASHBOARD_OPTIONS = {
  principal: {
    id: "principal",
    title: "Principal Management",
    description: "Manage principals and their access",
    link: "/screens/principals",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    textColor: "text-purple-500",
  },
  class: {
    id: "class",
    title: "Class Management",
    description: "Manage classes and schedules",
    link: "/screens/classes",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-500",
  },
  sessions: {
    id: "sessions",
    title: "Sessions Management",
    description: "Manage academic sessions",
    link: "/screens/sessions",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    textColor: "text-green-500",
  },
  teacher: {
    id: "teacher",
    title: "Teacher Management",
    description: "Manage teachers and assignments",
    link: "/screens/teachers",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    textColor: "text-orange-500",
  },
  coordinator: {
    id: "coordinator",
    title: "Coordinator Management",
    description: "Manage coordinators and roles",
    link: "/screens/coordinators",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-100",
    textColor: "text-pink-500",
  },
  applications: {
    id: "applications",
    title: "Applications",
    description: "Create and manage applications",
    link: "/screens/applications",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    textColor: "text-yellow-500",
  },
  tasks: {
    id: "tasks",
    title: "Tasks",
    description: "Create and manage tasks",
    link: "/screens/tasks",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    textColor: "text-cyan-500",
  },
  notes: {
    id: "notes",
    title: "Notes Management",
    description: "Manage and create notes",
    link: "/screens/notes",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    textColor: "text-indigo-500",
  },
};

// Role-based options mapping
const ROLE_OPTIONS = {
  owner: [
    "principal",
    "class",
    "sessions",
    "teacher",
    "coordinator",
    "attendance",
    "applications",
    "tasks",
    "notes",
  ],
  principal: [
    "class",
    "teacher",
    "coordinator",
    "applications",
    "tasks",
    "notes",
  ],
  coordinator: [
    "class",
    "teacher",
    "applications",
    "tasks",
  ],
};

const getBgColor = (bgClass) => {
  const colorMap = {
    "bg-purple-50": "#F3E8FF",
    "bg-blue-50": "#EFF6FF",
    "bg-green-50": "#D1FAE5",
    "bg-orange-50": "#FFEDD5",
    "bg-pink-50": "#FCE7F3",
    "bg-yellow-50": "#FEF9C3",
    "bg-cyan-50": "#CFFAFE",
    "bg-indigo-50": "#EEF2FF",
  };
  return colorMap[bgClass] || "#F9FAFB";
};

const getBorderColor = (borderClass) => {
  const colorMap = {
    "border-purple-100": "#E9D5FF",
    "border-blue-100": "#DBEAFE",
    "border-green-100": "#A7F3D0",
    "border-orange-100": "#FED7AA",
    "border-pink-100": "#FBCFE8",
    "border-yellow-100": "#FDE68A",
    "border-cyan-100": "#A5F3FC",
    "border-indigo-100": "#E0E7FF",
  };
  return colorMap[borderClass] || "#E5E7EB";
};

const getTextColor = (textClass) => {
  const colorMap = {
    "text-purple-500": "#A855F7",
    "text-blue-500": "#3B82F6",
    "text-green-500": "#10B981",
    "text-orange-500": "#F97316",
    "text-pink-500": "#EC4899",
    "text-yellow-500": "#F59E0B",
    "text-cyan-500": "#06B6D4",
    "text-indigo-500": "#6366F1",
  };
  return colorMap[textClass] || "#6B7280";
};

const Dashboard = () => {
  const router = useRouter();
  const { user, branchId } = useSelector((state) => state.auth);
  
  return (
    <ScrollView style={styles.container}>
      <Topbar />
      <StatsSection />
      
      {user?.role === "owner" && (
      <BranchSelectorSection />
      )}

      <View style={styles.content}>
        {user?.role === "admin" ? null : (
          (user?.role === "owner" || user?.role === "principal" || user?.role === "coordinator") &&
          branchId && (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>
                Management Options
              </Text>

              <View style={styles.optionsList}>
                {ROLE_OPTIONS[user?.role]?.map((optionKey) => {
                  const option = DASHBOARD_OPTIONS[optionKey];
                  if (!option) return null;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => router.push(option.link)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: getBgColor(option.bgColor),
                          borderColor: getBorderColor(option.borderColor),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: getTextColor(option.textColor) },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: hp(2),
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginBottom: hp(1.5),
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  optionsList: {
    // gap handled by marginBottom in optionCard
  },
  optionCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    marginBottom: 12,
  },
  optionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontWeight: '600',
    fontSize: hp(2.2),
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});
