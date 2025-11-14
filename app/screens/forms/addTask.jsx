import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useGetClassesByBranchQuery } from "../../../redux/api/classApi";
import { useGetCoordinatorsByBranchQuery } from "../../../redux/api/coordinator";
import { useGetPrincipalsByBranchQuery } from "../../../redux/api/principalApi";
import { useLazyGetProfileByRoleQuery } from "../../../redux/api/profileApi";
import { useGetStudentsByBranchAndClassQuery } from "../../../redux/api/studentApi";
import { useCreateTaskMutation } from "../../../redux/api/taskApi";
import { useGetTeachersByBranchQuery } from "../../../redux/api/teacherApi";

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  priority: Yup.string().oneOf(["low", "medium", "high"]).required("Priority is required"),
});

const PRIORITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const addTask = () => {
  const router = useRouter();
  const { user, schoolId, branchId } = useSelector((state) => state.auth);
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [getProfile] = useLazyGetProfileByRoleQuery();

  const role = user?.role;
  const authId = user?.id;

  const [assigneeRole, setAssigneeRole] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const canAssign = role === "owner" || role === "principal" || role === "coordinator" || role === "teacher";

  // Owner can assign to: principal, coordinator, teacher, student (NOT owner)
  // Principal: coordinator, teacher, student (NOT owner)
  // Coordinator: teacher, student (NOT owner)
  // Teacher: principal, coordinator, student (NOT owner)
  // Student: cannot create tasks
  const assigneeRoleOptions = useMemo(() => {
    if (role === "owner") {
      return [
        { id: "principal", label: "Principal" },
        { id: "coordinator", label: "Coordinator" },
        { id: "teacher", label: "Teacher" },
        { id: "student", label: "Student" },
      ];
    }
    if (role === "principal") {
      return [
        { id: "coordinator", label: "Coordinator" },
        { id: "teacher", label: "Teacher" },
        { id: "student", label: "Student" },
      ];
    }
    if (role === "coordinator") {
      return [
        { id: "teacher", label: "Teacher" },
        { id: "student", label: "Student" },
      ];
    }
    if (role === "teacher") {
      return [
        { id: "principal", label: "Principal" },
        { id: "coordinator", label: "Coordinator" },
        { id: "student", label: "Student" },
      ];
    }
    return [];
  }, [role]);

  // Fetch lists based on assigneeRole
  const { data: principals } = useGetPrincipalsByBranchQuery(branchId, {
    skip: !branchId || assigneeRole !== "principal",
  });
  const { data: coordinators } = useGetCoordinatorsByBranchQuery(branchId, {
    skip: !branchId || assigneeRole !== "coordinator",
  });
  const { data: teachers } = useGetTeachersByBranchQuery(branchId, {
    skip: !branchId || assigneeRole !== "teacher",
  });
  const { data: classes } = useGetClassesByBranchQuery(branchId, {
    skip: !branchId || assigneeRole !== "student",
  });
  const { data: students } = useGetStudentsByBranchAndClassQuery(
    { branchId, classId: selectedClassId || 0 },
    {
      skip: !branchId || !selectedClassId || assigneeRole !== "student",
    }
  );

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!authId || !role) {
        Alert.alert("Error", "User information is missing");
        return;
      }

      if (!canAssign) {
        Alert.alert("Error", "You do not have permission to create tasks");
        return;
      }

      if (!assigneeRole || !selectedAssignee?.authId) {
        Alert.alert("Error", "Please select an assignee for this task");
        return;
      }

      if (!schoolId || !branchId) {
        Alert.alert("Error", "School and branch are required to create a task");
        return;
      }

      // Fetch user's profile to get full_Name
      let createdByName = user?.email?.split("@")[0] || "Unknown User";

      try {
        const profileResult = await getProfile({ userId: authId, role }).unwrap();
        if (profileResult?.full_Name) {
          createdByName = profileResult.full_Name;
        }
      } catch (_err) {
        // ignore and use fallback
      }

      // Fetch assignee's profile to get assigned_To_Name
      let assignedToName = selectedAssignee.name || "Unknown User";
      
      // Determine assignee role for profile fetch
      let assigneeRoleForProfile = assigneeRole;
      try {
        const assigneeProfileResult = await getProfile({ 
          userId: selectedAssignee.authId, 
          role: assigneeRoleForProfile 
        }).unwrap();
        if (assigneeProfileResult?.full_Name) {
          assignedToName = assigneeProfileResult.full_Name;
        }
      } catch (_err) {
        // ignore and use fallback (selectedAssignee.name)
      }

      await createTask({
        school_Id: schoolId,
        branch_Id: branchId,
        created_By: authId,
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: "pending",
        created_By_Name: createdByName,
        created_By_Email: user?.email || null,
        assigned_To: selectedAssignee.authId,
        assigned_To_Name: assignedToName,
      }).unwrap();

      Alert.alert("Success", "Task created successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            setAssigneeRole(null);
            setSelectedAssignee(null);
            setSelectedClassId(null);
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.data?.message || error?.message || "Failed to create task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Student and admin cannot access this form
  if (role === "student" || role === "admin") {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { paddingHorizontal: 16 }]}>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.errorText}>
            You do not have permission to create tasks.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const renderAssigneeRoleSelector = () => {
    if (!canAssign || assigneeRoleOptions.length === 0) return null;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Assign To *</Text>
        <View style={styles.roleRow}>
          {assigneeRoleOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                setAssigneeRole(option.id);
                setSelectedAssignee(null);
                setSelectedClassId(null);
              }}
              style={[
                styles.roleChip,
                assigneeRole === option.id && styles.roleChipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.roleChipText,
                  assigneeRole === option.id && styles.roleChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAssigneeList = () => {
    if (!assigneeRole) return null;

    const renderOption = (item, authIdField, nameField, emailField) => {
      const authIdValue = item[authIdField];
      const nameValue = item[nameField];
      const emailValue = emailField ? item[emailField] : null;
      const isSelected = selectedAssignee?.authId === authIdValue;

      return (
        <TouchableOpacity
          key={authIdValue}
          onPress={() => setSelectedAssignee({ authId: authIdValue, name: nameValue })}
          style={[
            styles.assigneeCard,
            isSelected && styles.assigneeCardActive,
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.assigneeName} numberOfLines={1}>
            {nameValue}
          </Text>
          {emailValue && (
            <Text style={styles.assigneeEmail} numberOfLines={1}>
              {emailValue}
            </Text>
          )}
        </TouchableOpacity>
      );
    };

    if (assigneeRole === "principal") {
      if (!principals || principals.length === 0) {
        return (
          <Text style={styles.helperText}>
            No principals found for this branch.
          </Text>
        );
      }
      return (
        <View style={styles.assigneeList}>
          {principals.map((p) =>
            renderOption(p, "auth_User_Id", "full_Name", "email")
          )}
        </View>
      );
    }

    if (assigneeRole === "coordinator") {
      if (!coordinators || coordinators.length === 0) {
        return (
          <Text style={styles.helperText}>
            No coordinators found for this branch.
          </Text>
        );
      }
      return (
        <View style={styles.assigneeList}>
          {coordinators.map((c) =>
            renderOption(c, "auth_User_Id", "full_Name", "email")
          )}
        </View>
      );
    }

    if (assigneeRole === "teacher") {
      if (!teachers || teachers.length === 0) {
        return (
          <Text style={styles.helperText}>
            No teachers found for this branch.
          </Text>
        );
      }
      return (
        <View style={styles.assigneeList}>
          {teachers.map((t) =>
            renderOption(t, "auth_User_Id", "full_Name", "email")
          )}
        </View>
      );
    }

    if (assigneeRole === "student") {
      // For owner/principal/coordinator: list all students for branch+class?
      // For teacher: require class selection first
      if (role === "teacher") {
        if (!classes || classes.length === 0) {
          return (
            <Text style={styles.helperText}>
              No classes found for this branch.
            </Text>
          );
        }

        return (
          <>
            <Text style={styles.fieldLabel}>Select Class *</Text>
            <View style={styles.roleRow}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => {
                    setSelectedClassId(cls.id);
                    setSelectedAssignee(null);
                  }}
                  style={[
                    styles.roleChip,
                    selectedClassId === cls.id && styles.roleChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedClassId === cls.id && styles.roleChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cls.class_Name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedClassId && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                  Select Student *
                </Text>
                {!students || students.length === 0 ? (
                  <Text style={styles.helperText}>
                    No students found for this class.
                  </Text>
                ) : (
                  <View style={styles.assigneeList}>
                    {students.map((s) =>
                      renderOption(s, "auth_User_Id", "full_Name", "email")
                    )}
                  </View>
                )}
              </>
            )}
          </>
        );
      }

      // For owner/principal/coordinator: show all students for selected branch and class
      // To keep response fast and UI simple, we use the same pattern: pick a class first, then students
      if (!classes || classes.length === 0) {
        return (
          <Text style={styles.helperText}>
            No classes found for this branch. Please create a class first.
          </Text>
        );
      }

      return (
        <>
          <Text style={styles.fieldLabel}>Select Class *</Text>
          <View style={styles.roleRow}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => {
                  setSelectedClassId(cls.id);
                  setSelectedAssignee(null);
                }}
                style={[
                  styles.roleChip,
                  selectedClassId === cls.id && styles.roleChipActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    selectedClassId === cls.id && styles.roleChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cls.class_Name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedClassId && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                Select Student *
              </Text>
              {!students || students.length === 0 ? (
                <Text style={styles.helperText}>
                  No students found for this class.
                </Text>
              ) : (
                <View style={styles.assigneeList}>
                  {students.map((s) =>
                    renderOption(s, "auth_User_Id", "full_Name", "email")
                  )}
                </View>
              )}
            </>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Task</Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new task
              </Text>
            </View>

            <Formik
              initialValues={{
                title: "",
                description: "",
                priority: "medium",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit: formikSubmit,
                isSubmitting,
                setFieldValue,
              }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Title *</Text>
                      <Input
                        placeholder="Enter task title"
                        value={values.title}
                        onChangeText={handleChange("title")}
                        onBlur={handleBlur("title")}
                        type="text"
                      />
                      {touched.title && errors.title && (
                        <Text style={styles.errorText}>{errors.title}</Text>
                      )}
                    </View>

                    {/* Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Description *</Text>
                      <Input
                        placeholder="Describe the task"
                        value={values.description}
                        onChangeText={handleChange("description")}
                        onBlur={handleBlur("description")}
                        type="text"
                        multiline
                        numberOfLines={4}
                      />
                      {touched.description && errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                      )}
                    </View>

                    {/* Priority */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Priority *</Text>
                      <View style={styles.roleRow}>
                        {PRIORITY_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            onPress={() => setFieldValue("priority", option.id)}
                            style={[
                              styles.roleChip,
                              values.priority === option.id && styles.roleChipActive,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.roleChipText,
                                values.priority === option.id && styles.roleChipTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {touched.priority && errors.priority && (
                        <Text style={styles.errorText}>{errors.priority}</Text>
                      )}
                    </View>

                    {/* Assignee Role & List */}
                    {renderAssigneeRoleSelector()}
                    {renderAssigneeList()}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        bgColor="#6B7280"
                        textColor="#FFFFFF"
                        className="flex-1"
                      />
                    </View>
                    <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                      <Button
                        title={isCreating || isSubmitting ? "Adding..." : "Add Task"}
                        onPress={formikSubmit}
                        bgColor="#1CACF3"
                        textColor="#FFFFFF"
                        className="flex-1"
                        loading={isCreating || isSubmitting}
                        disabled={isCreating || isSubmitting}
                      />
                    </View>
                  </View>
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default addTask;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  formFields: {
    // gap handled by marginBottom in fieldContainer
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#374151",
    marginBottom: hp(1),
  },
  errorText: {
    color: "#EF4444",
    fontSize: hp(1.3),
    marginTop: hp(0.5),
  },
  helperText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    marginTop: 4,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FBBF24",
  },
  roleChipText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  roleChipTextActive: {
    color: "#F59E0B",
  },
  assigneeList: {
    marginTop: 8,
  },
  assigneeCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  assigneeCardActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  assigneeName: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#111827",
  },
  assigneeEmail: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
});


