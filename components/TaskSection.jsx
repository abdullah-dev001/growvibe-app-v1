import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Plus from "../assets/icons/Plus";
import { hp } from "../helpers/common";
import Button from "./Button";
import TaskCard from "./TaskCard";

const TaskSection = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Button
          title="Manage Tasks"
          onPress={() => router.push("/screens/tasks")}
          bgColor="#1CACF3"
          textColor="#FFFFFF"
          size="small"
          icon={<Plus size={hp(2.4)} color="#FFFFFF" strokeWidth={2} />}
        />
      </View>
      {/* Static CTA – full task list lives in /screens/tasks */}
      <TaskCard
        todo_Title="Task Management"
        todo_Description="Open the Tasks screen to view and manage tasks."
        todo_Priority="medium"
        expire_Date={null}
        created_By=""
        onPress={() => router.push("/screens/tasks")}
      />
    </View>
  );
};

export default TaskSection;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: hp(2.4),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
});
