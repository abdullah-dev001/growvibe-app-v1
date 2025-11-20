import { useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import React from "react";
import {
    ActivityIndicator,
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
import { useCreateAuthMutation, useUpdateAuthMutation } from "../../../redux/api/createAuthApi";
import { useGetTeacherByIdQuery } from "../../../redux/api/teacherApi";

// Validation Schema Factory
const getValidationSchema = (isEditMode) => Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: isEditMode
    ? Yup.string()
        .min(6, "Password must be at least 6 characters")
        .nullable()
        .transform((value) => (value === "" ? null : value))
    : Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
  salary: Yup.string().required("Salary is required"),
  teacher_Status: Yup.boolean().required("Teacher status is required"),
  name: Yup.string().required("Teacher name is required"),
});

const addTeacher = () => {
  const router = useRouter();
  const { user, schoolId, branchId } = useSelector((state) => state.auth);
  const { teacherId } = useLocalSearchParams();
  const isEditMode = !!teacherId;
  const [createAuth, { isLoading: isCreating }] = useCreateAuthMutation();
  const [updateAuth, { isLoading: isUpdating }] = useUpdateAuthMutation();
  const { data: teacherData, isLoading: isLoadingTeacher } = useGetTeacherByIdQuery(teacherId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  // const handleSubmit = async (values, { setSubmitting }) => {
  //   try {
  //     const teacherData = {
  //       email: values.email,
  //       password: values.password,
  //       teacher_Status: values.teacher_Status,
  //       role: 'teacher',
  //     };

  //     // TODO: Replace with actual API call

  //     Alert.alert(
  //       'Success',
  //       'Teacher added successfully!',
  //       [
  //         {
  //           text: 'OK',
  //           onPress: () => router.back()
  //         }
  //       ]
  //     );
  //   } catch (error) {
  //     Alert.alert('Error', error.message || 'Failed to add teacher');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const salaryValue =
        values.salary && !Number.isNaN(Number(values.salary))
          ? Number(values.salary)
          : null;

      if (salaryValue === null) {
        Alert.alert("Invalid Input", "Please enter a valid salary amount.");
        setSubmitting(false);
        return;
      }

      if (isEditMode) {
        const authId = teacherData?.auth_User_Id || teacherId;
        if (!authId) {
          Alert.alert("Error", "Teacher auth ID not available");
          return;
        }
        await updateAuth({
          user_Id: authId,
          email: values.email,
          password: values.password || undefined,
          status: values.teacher_Status,
          role: "teacher",
          school_Id: schoolId,
          branch_Id: branchId,
          fullName: values.name,
          salary: salaryValue,
        }).unwrap();

        Alert.alert("Success", "Teacher updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createAuth({
          email: values.email,
          password: values.password,
          status: values.teacher_Status,
          salary: salaryValue,
          fullName: values.name,
          role: "teacher",
          school_Id: schoolId,
          branch_Id: branchId,
        }).unwrap();

        Alert.alert("Success", "Teacher added successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error?.message || error?.data?.message || "Failed to save teacher");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while fetching teacher data
  if (isEditMode && isLoadingTeacher) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading teacher data...</Text>
        </View>
      </ScreenWrapper>
    );
  }
  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isEditMode ? "Edit Teacher" : "Add New Teacher"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode
                  ? "Update the teacher details"
                  : "Fill in the details to add a new teacher"}
              </Text>
            </View>

            <Formik
              key={teacherData?.auth_User_Id || "new"}
              initialValues={{
                email: teacherData?.email || "",
                password: "",
                salary:
                  teacherData?.salary !== undefined && teacherData?.salary !== null
                    ? String(teacherData.salary)
                    : "",
                name: teacherData?.full_Name || "",
                teacher_Status:
                  teacherData?.profile_Status !== undefined ? teacherData.profile_Status : true,
              }}
              validationSchema={getValidationSchema(isEditMode)}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
                handleSubmit: formikSubmit,
                isSubmitting,
              }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Email */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Email *
                      </Text>
                      <Input
                        placeholder="Enter teacher email"
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        type="email"
                      />
                      {touched.email && errors.email && (
                        <Text style={styles.errorText}>
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Password {isEditMode ? "(leave blank to keep current)" : "*"}
                      </Text>
                      <Input
                        placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        type="password"
                      />
                      {touched.password && errors.password && (
                        <Text style={styles.errorText}>
                          {errors.password}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Teacher Name *
                      </Text>
                      <Input
                        placeholder="Enter Teacher Name"
                        value={values.name}
                        onChangeText={handleChange("name")}
                        onBlur={handleBlur("name")}
                        type="text"
                      />
                      {touched.name && errors.name && (
                        <Text style={styles.errorText}>
                          {errors.name}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Salary (Monthly) *
                      </Text>
                      <Input
                        placeholder="Enter salary"
                        value={values.salary}
                        onChangeText={handleChange("salary")}
                        onBlur={handleBlur("salary")}
                        type="number"
                      />
                      {touched.salary && errors.salary && (
                        <Text style={styles.errorText}>
                          {errors.salary}
                        </Text>
                      )}
                    </View>

                    {/* Teacher Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Teacher Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue("teacher_Status", true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.teacher_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.teacher_Status ? "#10B981" : "#6B7280" }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue("teacher_Status", false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.teacher_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.teacher_Status ? "#EF4444" : "#6B7280" }
                            ]}
                          >
                            Inactive
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
                        title={isEditMode ? "Update Teacher" : "Add Teacher"}
                        onPress={formikSubmit}
                        bgColor="#F97316"
                        textColor="#FFFFFF"
                        className="flex-1"
                        loading={isSubmitting || isLoading}
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

export default addTeacher;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-SemiBold",
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
  statusRow: {
    flexDirection: "row",
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  statusButtonInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  statusButtonInactiveRed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  statusButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
});
