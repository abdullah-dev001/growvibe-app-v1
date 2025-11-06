import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Plus from "../assets/icons/Plus";
import { hp } from "../helpers/common";
import Button from "./Button";
import TaskCard from "./TaskCard";

const TaskSection = () => {
  const sampleTasks = [
    {
      id: 1,
      todo_Title: "Complete Project Documentation",
      todo_Description:
        "Write comprehensive documentation for the new API endpoints including examples and error handling scenarios.",
      todo_Priority: "high",
      expire_Date: "2026-01-15",
      created_By: "John Doe",
    },
    {
      id: 2,
      todo_Title: "Review Code Changes",
      todo_Description:
        "Review the recent pull requests and provide feedback on the implementation.",
      todo_Priority: "medium",
      expire_Date: "2026-01-20",
      created_By: "Sarah Wilson",
    },
    {
      id: 3,
      todo_Title: "Update User Interface",
      todo_Description:
        "Update the dashboard UI components to match the new design system.",
      todo_Priority: "low",
      expire_Date: "2026-01-25",
      created_By: "Mike Johnson",
    },
  ];

  const handleTaskPress = (task) => {
    // Handle task press
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Button
          title="Add Task"
          onPress={() => {}}
          bgColor="#1CACF3"
          textColor="#FFFFFF"
          size="small"
          icon={<Plus size={hp(2.4)} color="#FFFFFF" strokeWidth={2} />}
        />
      </View>
      {sampleTasks.map((task) => (
        <TaskCard
          key={task.id}
          todo_Title={task.todo_Title}
          todo_Description={task.todo_Description}
          todo_Priority={task.todo_Priority}
          expire_Date={task.expire_Date}
          created_By={task.created_By}
          onPress={() => handleTaskPress(task)}
        />
      ))}
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
