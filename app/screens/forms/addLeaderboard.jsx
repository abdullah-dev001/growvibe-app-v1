import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
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
import Trash from "../../../assets/icons/Trash";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useCreateLeaderboardMutation } from "../../../redux/api/leaderboardApi";
import { useGetStudentsByBranchAndClassQuery } from "../../../redux/api/studentApi";

// Validation Schema
const validationSchema = Yup.object().shape({
  leaderboard_Title: Yup.string()
    .required("Leaderboard title is required")
    .min(3, "Leaderboard title must be at least 3 characters"),
  expire_Date: Yup.string().required("Expire date is required"),
  students: Yup.array()
    .of(
      Yup.object().shape({
        student_Id: Yup.string().required("Student is required"),
        rank: Yup.string().required("Rank is required"),
      })
    )
    .min(1, "At least one student is required"),
});

const addLeaderboard = () => {
  const router = useRouter();
  const { branchId, classId, user } = useSelector((state) => state.auth);
  const [createLeaderboard, { isLoading: isCreating }] = useCreateLeaderboardMutation();

  // Fetch students for selector
  const { data: studentsData } = useGetStudentsByBranchAndClassQuery(
    { branchId, classId },
    { skip: !branchId || !classId }
  );
  const students = studentsData || [];

  // Date picker states
  const [showExpireDatePicker, setShowExpireDatePicker] = useState(false);
  const [tempExpireDate, setTempExpireDate] = useState(new Date());

  // Student selector state
  const [showStudentSelector, setShowStudentSelector] = useState(null); // null or student index
  const [searchQuery, setSearchQuery] = useState("");

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleExpireDateChange = (event, selectedDate, setFieldValue) => {
    if (Platform.OS === "android") {
      setShowExpireDatePicker(false);
    }
    if (selectedDate) {
      setTempExpireDate(selectedDate);
      if (Platform.OS === "android") {
        const formattedDate = formatDateForInput(selectedDate);
        setFieldValue("expire_Date", formattedDate);
      }
    }
  };

  const confirmExpireDate = (setFieldValue) => {
    const formattedDate = formatDateForInput(tempExpireDate);
    setFieldValue("expire_Date", formattedDate);
    setShowExpireDatePicker(false);
  };

  const handleStudentSelect = (studentId, setFieldValue, values) => {
    if (showStudentSelector === null) return;
    const studentIndex = showStudentSelector;
    const newStudents = [...values.students];
    newStudents[studentIndex].student_Id = studentId;
    setFieldValue("students", newStudents);
    setShowStudentSelector(null);
    setSearchQuery("");
  };

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (student.full_Name && student.full_Name.toLowerCase().includes(query)) ||
      (student.email && student.email.toLowerCase().includes(query))
    );
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const leaderboardData = {
        branch_Id: branchId,
        class_Id: classId || null,
        leaderboard_Title: values.leaderboard_Title,
        expire_Date: values.expire_Date,
        created_By: user?.id,
        students: values.students,
      };

      await createLeaderboard(leaderboardData).unwrap();

      Alert.alert("Success", "Leaderboard created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to create leaderboard:", error);
      Alert.alert("Error", error.message || "Failed to create leaderboard. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Leaderboard</Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new leaderboard
              </Text>
            </View>

            <Formik
              initialValues={{
                leaderboard_Title: "",
                expire_Date: "",
                students: [
                  {
                    student_Id: "",
                    rank: "",
                  },
                ],
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
                setFieldValue,
                handleSubmit: formikSubmit,
                isSubmitting,
              }) => {
                return (
                  <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Leaderboard Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Leaderboard Title *</Text>
                      <Input
                        placeholder="Enter leaderboard title (e.g., Top Scorers - Final Term)"
                        value={values.leaderboard_Title}
                        onChangeText={handleChange("leaderboard_Title")}
                        onBlur={handleBlur("leaderboard_Title")}
                        type="text"
                      />
                      {touched.leaderboard_Title && errors.leaderboard_Title && (
                        <Text style={styles.errorText}>{errors.leaderboard_Title}</Text>
                      )}
                    </View>

                    {/* Expire Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Expire Date *</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (values.expire_Date) {
                            setTempExpireDate(new Date(values.expire_Date));
                          }
                          setShowExpireDatePicker(true);
                        }}
                        style={styles.datePickerButton}
                      >
                        <Text
                          style={[
                            styles.datePickerButtonText,
                            { color: values.expire_Date ? "#111827" : "#9CA3AF" }
                          ]}
                        >
                          {values.expire_Date || "Select expire date"}
                        </Text>
                      </TouchableOpacity>
                      {touched.expire_Date && errors.expire_Date && (
                        <Text style={styles.errorText}>{errors.expire_Date}</Text>
                      )}
                      {showExpireDatePicker && (
                        <View style={styles.datePickerContainer}>
                          <DateTimePicker
                            value={tempExpireDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "compact" : "default"}
                            onChange={(event, selectedDate) =>
                              handleExpireDateChange(event, selectedDate, setFieldValue)
                            }
                            minimumDate={new Date()}
                            style={{
                              height: Platform.OS === "ios" ? 50 : 200,
                              backgroundColor: "white",
                            }}
                            textColor="#111827"
                            accentColor="#10B981"
                          />
                          {Platform.OS === "ios" && (
                            <View style={styles.datePickerActions}>
                              <TouchableOpacity
                                onPress={() => setShowExpireDatePicker(false)}
                                style={styles.datePickerActionButton}
                              >
                                <Text style={styles.datePickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => confirmExpireDate(setFieldValue)}
                                style={[styles.datePickerActionButton, { marginLeft: 12 }]}
                              >
                                <Text style={styles.datePickerDoneText}>
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Students Array */}
                    <View style={styles.fieldContainer}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text style={styles.fieldLabel}>Students *</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setFieldValue("students", [
                              ...values.students,
                              {
                                student_Id: "",
                                rank: "",
                              },
                            ]);
                          }}
                          style={styles.addStudentButton}
                        >
                          <Text style={styles.addStudentButtonText}>
                            + Add Student
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {values.students.map((student, studentIndex) => (
                        <View key={studentIndex} style={styles.studentContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <Text style={styles.studentLabel}>
                              Student {studentIndex + 1}
                            </Text>
                            {values.students.length > 1 && (
                              <TouchableOpacity
                                onPress={() => {
                                  const newStudents = values.students.filter(
                                    (_, i) => i !== studentIndex
                                  );
                                  setFieldValue("students", newStudents);
                                }}
                                style={styles.removeStudentButton}
                              >
                                <Trash size={hp(1.4)} color="#EF4444" strokeWidth={2} />
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Student Selector */}
                          <View style={styles.studentFieldContainer}>
                            <Text style={styles.studentFieldLabel}>Student *</Text>
                            <TouchableOpacity
                              onPress={() => {
                                setShowStudentSelector(showStudentSelector === studentIndex ? null : studentIndex);
                                setSearchQuery("");
                              }}
                              style={styles.studentSelectorButton}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.studentSelectorButtonText,
                                  {
                                    color: student.student_Id ? "#111827" : "#9CA3AF"
                                  }
                                ]}
                              >
                                {student.student_Id
                                  ? students.find((s) => s.auth_User_Id === student.student_Id)?.full_Name || student.student_Id
                                  : "Select student"}
                              </Text>
                              <Text style={[
                                styles.dropdownArrow,
                                showStudentSelector === studentIndex && styles.dropdownArrowOpen
                              ]}>
                                ▼
                              </Text>
                            </TouchableOpacity>
                            {touched.students?.[studentIndex]?.student_Id &&
                              errors.students?.[studentIndex]?.student_Id && (
                                <Text style={styles.errorText}>
                                  {errors.students[studentIndex].student_Id}
                                </Text>
                              )}
                            
                            {/* Student Selector Dropdown */}
                            {showStudentSelector === studentIndex && (
                              <View style={styles.studentSelectorDropdown}>
                                <View style={styles.searchInputContainer}>
                                  <Input
                                    placeholder="Search student by name or email..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    type="text"
                                  />
                                </View>
                                <View style={styles.studentList}>
                                  {filteredStudents.length > 0 ? (
                                    filteredStudents.map((studentItem) => (
                                      <TouchableOpacity
                                        key={studentItem.auth_User_Id}
                                        onPress={() => handleStudentSelect(studentItem.auth_User_Id, setFieldValue, values)}
                                        style={[
                                          styles.studentOption,
                                          student.student_Id === studentItem.auth_User_Id && styles.studentOptionSelected
                                        ]}
                                        activeOpacity={0.7}
                                      >
                                        <View style={styles.studentOptionContent}>
                                          <View style={styles.studentInfo}>
                                            <Text style={styles.studentOptionName}>
                                              {studentItem.full_Name || 'No Name'}
                                            </Text>
                                            {studentItem.email && (
                                              <Text style={styles.studentOptionEmail}>
                                                {studentItem.email}
                                              </Text>
                                            )}
                                          </View>
                                          {student.student_Id === studentItem.auth_User_Id && (
                                            <View style={styles.checkmark}>
                                              <Text style={styles.checkmarkText}>✓</Text>
                                            </View>
                                          )}
                                        </View>
                                      </TouchableOpacity>
                                    ))
                                  ) : (
                                    <View style={styles.emptyStudentList}>
                                      <Text style={styles.emptyStudentText}>No students found</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                          </View>

                          {/* Rank */}
                          <View style={styles.studentFieldContainer}>
                            <Text style={styles.studentFieldLabel}>Rank *</Text>
                            <Input
                              placeholder="Enter rank (e.g., 1, 2, 3)"
                              value={student.rank}
                              onChangeText={(text) => {
                                const newStudents = [...values.students];
                                newStudents[studentIndex].rank = text;
                                setFieldValue("students", newStudents);
                              }}
                              onBlur={() => handleBlur(`students[${studentIndex}].rank`)}
                              type="numeric"
                            />
                            {touched.students?.[studentIndex]?.rank &&
                              errors.students?.[studentIndex]?.rank && (
                                <Text style={styles.errorText}>
                                  {errors.students[studentIndex].rank}
                                </Text>
                              )}
                          </View>
                        </View>
                      ))}

                      {touched.students && errors.students && typeof errors.students === 'string' && (
                        <Text style={styles.errorText}>{errors.students}</Text>
                      )}
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
                      />
                    </View>
                    <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                      <Button
                        title="Add Leaderboard"
                        onPress={formikSubmit}
                        bgColor="#10B981"
                        textColor="#FFFFFF"
                        loading={isSubmitting || isCreating}
                      />
                    </View>
                  </View>
                  </>
                );
              }}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default addLeaderboard;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
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
    // Spacing handled by marginBottom in fieldContainer
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
  datePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  datePickerButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  datePickerActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerCancelText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  datePickerDoneText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#10B981",
  },
  addStudentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#10B981",
    borderRadius: 6,
  },
  addStudentButtonText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  studentContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  studentLabel: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-SemiBold",
    color: "#374151",
  },
  removeStudentButton: {
    padding: 4,
  },
  studentFieldContainer: {
    marginTop: 12,
  },
  studentFieldLabel: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#374151",
    marginBottom: 6,
  },
  studentSelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentSelectorButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: hp(1.2),
    color: "#6B7280",
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  studentSelectorDropdown: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: hp(35),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  searchInputContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  studentList: {
    maxHeight: hp(28),
  },
  studentOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  studentOptionSelected: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  studentOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentOptionName: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginBottom: 2,
  },
  studentOptionEmail: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  checkmark: {
    width: hp(2.5),
    height: hp(2.5),
    borderRadius: hp(1.25),
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    fontSize: hp(1.2),
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
  },
  emptyStudentList: {
    padding: 24,
    alignItems: "center",
  },
  emptyStudentText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
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

