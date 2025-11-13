import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useCreateResultMutation } from "../../../redux/api/resultApi";

// Validation Schema
const validationSchema = Yup.object().shape({
  result_Title: Yup.string()
    .required("Result title is required")
    .min(3, "Result title must be at least 3 characters"),
  result_Description: Yup.string(),
  expire_Date: Yup.string().required("Expire date is required"),
  total_Marks: Yup.string().required("Total marks is required"),
  student_Total_Marks: Yup.string().required("Student total marks is required"),
  subjects: Yup.array()
    .of(
      Yup.object().shape({
        subject_Name: Yup.string().required("Subject name is required"),
        obtained_Makrs: Yup.string().required("Obtained marks is required"),
        total_Marks: Yup.string().required("Subject total marks is required"),
      })
    )
    .min(1, "At least one subject is required"),
});

const addResult = () => {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { branchId } = useSelector((state) => state.auth);
  const [createResult, { isLoading: isCreating }] = useCreateResultMutation();

  // Date picker states
  const [showExpireDatePicker, setShowExpireDatePicker] = useState(false);
  const [tempExpireDate, setTempExpireDate] = useState(new Date());

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

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!studentId) {
      Alert.alert("Error", "Student ID is required");
      setSubmitting(false);
      return;
    }

    try {
      const resultData = {
        branch_Id: branchId,
        expire_Date: values.expire_Date,
        result_Title: values.result_Title,
        result_Description: values.result_Description || "",
        total_Marks: values.total_Marks,
        student_Id: studentId,
        student_Total_Marks: values.student_Total_Marks,
        subjects: values.subjects,
      };

      await createResult(resultData).unwrap();

      Alert.alert("Success", "Result created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create result. Please try again.");
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
              <Text style={styles.headerTitle}>Add New Result</Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new result
              </Text>
            </View>

            <Formik
              initialValues={{
                result_Title: "",
                result_Description: "",
                expire_Date: "",
                total_Marks: "",
                student_Total_Marks: "",
                subjects: [{ subject_Name: "", obtained_Makrs: "", total_Marks: "" }],
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
                    {/* Result Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Result Title *</Text>
                      <Input
                        placeholder="Enter result title (e.g., Mid Term Result)"
                        value={values.result_Title}
                        onChangeText={handleChange("result_Title")}
                        onBlur={handleBlur("result_Title")}
                        type="text"
                      />
                      {touched.result_Title && errors.result_Title && (
                        <Text style={styles.errorText}>{errors.result_Title}</Text>
                      )}
                    </View>

                    {/* Result Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Description</Text>
                      <Input
                        placeholder="Enter result description (optional)"
                        value={values.result_Description}
                        onChangeText={handleChange("result_Description")}
                        onBlur={handleBlur("result_Description")}
                        type="text"
                        multiline={true}
                        numberOfLines={4}
                      />
                      {touched.result_Description && errors.result_Description && (
                        <Text style={styles.errorText}>{errors.result_Description}</Text>
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
                        <Text style={styles.errorText}>
                          {errors.expire_Date}
                        </Text>
                      )}
                      {/* Date Picker */}
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
                            accentColor="#8B5CF6"
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

                    {/* Total Marks */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Total Marks *</Text>
                      <Input
                        placeholder="Enter total marks (e.g., 600)"
                        value={values.total_Marks}
                        onChangeText={handleChange("total_Marks")}
                        onBlur={handleBlur("total_Marks")}
                        type="numeric"
                      />
                      {touched.total_Marks && errors.total_Marks && (
                        <Text style={styles.errorText}>{errors.total_Marks}</Text>
                      )}
                    </View>

                    {/* Student Total Marks */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Student Total Marks *</Text>
                      <Input
                        placeholder="Enter student total marks"
                        value={values.student_Total_Marks}
                        onChangeText={handleChange("student_Total_Marks")}
                        onBlur={handleBlur("student_Total_Marks")}
                        type="numeric"
                      />
                      {touched.student_Total_Marks && errors.student_Total_Marks && (
                        <Text style={styles.errorText}>{errors.student_Total_Marks}</Text>
                      )}
                    </View>

                    {/* Subjects Array */}
                    <View style={styles.fieldContainer}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text style={styles.fieldLabel}>Subjects *</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setFieldValue("subjects", [
                              ...values.subjects,
                              { subject_Name: "", obtained_Makrs: "", total_Marks: "" },
                            ]);
                          }}
                          style={styles.addSubjectButton}
                        >
                          <Text style={styles.addSubjectButtonText}>
                            + Add Subject
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {values.subjects.map((subject, subjectIndex) => (
                        <View key={subjectIndex} style={styles.subjectContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <Text style={styles.subjectLabel}>
                              Subject {subjectIndex + 1}
                            </Text>
                            {values.subjects.length > 1 && (
                              <TouchableOpacity
                                onPress={() => {
                                  const newSubjects = values.subjects.filter(
                                    (_, i) => i !== subjectIndex
                                  );
                                  setFieldValue("subjects", newSubjects);
                                }}
                                style={styles.removeSubjectButton}
                              >
                                <Trash size={hp(1.4)} color="#EF4444" strokeWidth={2} />
                              </TouchableOpacity>
                            )}
                          </View>

                          <View style={styles.subjectFieldContainer}>
                            <Text style={styles.subjectFieldLabel}>
                              Subject Name *
                            </Text>
                            <Input
                              placeholder="Enter subject name"
                              value={subject.subject_Name}
                              onChangeText={(text) => {
                                const newSubjects = [...values.subjects];
                                newSubjects[subjectIndex].subject_Name = text;
                                setFieldValue("subjects", newSubjects);
                              }}
                              onBlur={() => handleBlur(`subjects[${subjectIndex}].subject_Name`)}
                              type="text"
                            />
                            {touched.subjects?.[subjectIndex]?.subject_Name &&
                              errors.subjects?.[subjectIndex]?.subject_Name && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[subjectIndex].subject_Name}
                                </Text>
                              )}
                          </View>

                          <View style={styles.subjectFieldContainer}>
                            <Text style={styles.subjectFieldLabel}>
                              Obtained Marks *
                            </Text>
                            <Input
                              placeholder="Enter obtained marks"
                              value={subject.obtained_Makrs}
                              onChangeText={(text) => {
                                const newSubjects = [...values.subjects];
                                newSubjects[subjectIndex].obtained_Makrs = text;
                                setFieldValue("subjects", newSubjects);
                              }}
                              onBlur={() => handleBlur(`subjects[${subjectIndex}].obtained_Makrs`)}
                              type="numeric"
                            />
                            {touched.subjects?.[subjectIndex]?.obtained_Makrs &&
                              errors.subjects?.[subjectIndex]?.obtained_Makrs && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[subjectIndex].obtained_Makrs}
                                </Text>
                              )}
                          </View>

                          <View style={styles.subjectFieldContainer}>
                            <Text style={styles.subjectFieldLabel}>
                              Total Marks *
                            </Text>
                            <Input
                              placeholder="Enter subject total marks"
                              value={subject.total_Marks}
                              onChangeText={(text) => {
                                const newSubjects = [...values.subjects];
                                newSubjects[subjectIndex].total_Marks = text;
                                setFieldValue("subjects", newSubjects);
                              }}
                              onBlur={() => handleBlur(`subjects[${subjectIndex}].total_Marks`)}
                              type="numeric"
                            />
                            {touched.subjects?.[subjectIndex]?.total_Marks &&
                              errors.subjects?.[subjectIndex]?.total_Marks && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[subjectIndex].total_Marks}
                                </Text>
                              )}
                          </View>
                        </View>
                      ))}

                      {touched.subjects && errors.subjects && typeof errors.subjects === 'string' && (
                        <Text style={styles.errorText}>{errors.subjects}</Text>
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
                        title="Add Result"
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

export default addResult;

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
  subjectContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  subjectLabel: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-SemiBold",
    color: "#374151",
  },
  subjectFieldContainer: {
    marginTop: 12,
  },
  subjectFieldLabel: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#374151",
    marginBottom: 6,
  },
  addSubjectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#10B981",
    borderRadius: 6,
  },
  addSubjectButtonText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  removeSubjectButton: {
    padding: 4,
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

