import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
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
import { useCreateDatesheetMutation, useGetDatesheetByIdQuery, useUpdateDatesheetMutation } from "../../../redux/api/datesheetApi";

// Validation Schema
const validationSchema = Yup.object().shape({
  datesheet_Title: Yup.string()
    .required("Datesheet title is required")
    .min(3, "Datesheet title must be at least 3 characters"),
  datesheet_Description: Yup.string(),
  expire_Date: Yup.string().required("Expire date is required"),
  subjects: Yup.array()
    .of(
      Yup.object().shape({
        subject_Name: Yup.string().required("Subject name is required"),
        date: Yup.string().required("Subject date is required"),
      })
    )
    .min(1, "At least one subject is required"),
});

const addDatesheet = () => {
  const router = useRouter();
  const { datesheetId } = useLocalSearchParams();
  const isEditMode = !!datesheetId;
  const { branchId, user, classId } = useSelector((state) => state.auth);
  const [createDatesheet, { isLoading: isCreating }] = useCreateDatesheetMutation();
  const [updateDatesheet, { isLoading: isUpdating }] = useUpdateDatesheetMutation();
  const {
    data: datesheetData,
    isLoading: isLoadingDatesheet,
    error: datesheetError,
  } = useGetDatesheetByIdQuery(datesheetId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  // Check for errors when loading datesheet data
  useEffect(() => {
    if (isEditMode && datesheetError) {
      Alert.alert("Error", "Failed to load datesheet data. Please try again.");
    }
  }, [datesheetError, isEditMode]);

  // Date picker states
  const [showExpireDatePicker, setShowExpireDatePicker] = useState(false);
  const [tempExpireDate, setTempExpireDate] = useState(new Date());
  const [showSubjectDatePicker, setShowSubjectDatePicker] = useState(null); // null or index
  const [tempSubjectDate, setTempSubjectDate] = useState(new Date());

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
    try {
      if (isEditMode) {
        const updateData = {
          datesheet_Id: datesheetId,
          branch_Id: branchId,
          class_Id: classId || null,
          datesheet_Title: values.datesheet_Title,
          datesheet_Description: values.datesheet_Description || "",
          expire_Date: values.expire_Date,
          subjects: values.subjects,
        };

        await updateDatesheet(updateData).unwrap();

        Alert.alert("Success", "Datesheet updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        const createData = {
          branch_Id: branchId,
          class_Id: classId || null,
          datesheet_Title: values.datesheet_Title,
          datesheet_Description: values.datesheet_Description || "",
          created_By: user?.id,
          expire_Date: values.expire_Date,
          subjects: values.subjects,
        };

        await createDatesheet(createData).unwrap();

        Alert.alert("Success", "Datesheet created successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || `Failed to ${isEditMode ? 'update' : 'create'} datesheet. Please try again.`);
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
              <Text style={styles.headerTitle}>
                {isEditMode ? "Edit Datesheet" : "Add New Datesheet"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode 
                  ? "Update the datesheet details below"
                  : "Fill in the details to create a new datesheet"}
              </Text>
            </View>

            {isLoadingDatesheet ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading datesheet data...</Text>
              </View>
            ) : (isEditMode && !datesheetData) ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Failed to load datesheet data. Please go back and try again.</Text>
              </View>
            ) : (
            <Formik
              key={isEditMode && datesheetData ? `edit-${datesheetData.datesheet_id || datesheetData.datesheet_Id || datesheetData.id}` : 'create'}
              initialValues={{
                datesheet_Title: datesheetData?.datesheet_Title || datesheetData?.title || "",
                datesheet_Description: datesheetData?.datesheet_Description || datesheetData?.description || "",
                expire_Date: datesheetData?.expire_Date || datesheetData?.expire_date || "",
                subjects: (() => {
                  if (!datesheetData?.subjects) {
                    return [{ subject_Name: "", date: "" }];
                  }
                  // Handle both string (JSON) and array formats
                  let subjectsArray = [];
                  try {
                    const subjectsData = datesheetData.subjects;
                    subjectsArray = typeof subjectsData === 'string' 
                      ? JSON.parse(subjectsData) 
                      : Array.isArray(subjectsData) ? subjectsData : [];
                  } catch (e) {
                    subjectsArray = [];
                  }
                  return subjectsArray.length > 0 
                    ? subjectsArray.map((subject) => ({
                        subject_Name: subject.subject_Name || subject.subject_name || "",
                        date: subject.date || "",
                      }))
                    : [{ subject_Name: "", date: "" }];
                })(),
              }}
              enableReinitialize={true}
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
              }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Datesheet Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Datesheet Title *</Text>
                      <Input
                        placeholder="Enter datesheet title (e.g., Mid Term Exams)"
                        value={values.datesheet_Title}
                        onChangeText={handleChange("datesheet_Title")}
                        onBlur={handleBlur("datesheet_Title")}
                        type="text"
                      />
                      {touched.datesheet_Title && errors.datesheet_Title && (
                        <Text style={styles.errorText}>{errors.datesheet_Title}</Text>
                      )}
                    </View>

                    {/* Datesheet Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Description</Text>
                      <Input
                        placeholder="Enter datesheet description (optional)"
                        value={values.datesheet_Description}
                        onChangeText={handleChange("datesheet_Description")}
                        onBlur={handleBlur("datesheet_Description")}
                        type="text"
                        multiline={true}
                        numberOfLines={4}
                      />
                      {touched.datesheet_Description && errors.datesheet_Description && (
                        <Text style={styles.errorText}>{errors.datesheet_Description}</Text>
                      )}
                    </View>

                    {/* Expire Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Expire Date *</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (values.expire_Date) {
                            setTempExpireDate(new Date(values.expire_Date));
                          } else {
                            setTempExpireDate(new Date());
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
                              { subject_Name: "", date: "" },
                            ]);
                          }}
                          style={styles.addSubjectButton}
                        >
                          <Text style={styles.addSubjectButtonText}>
                            + Add Subject
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {values.subjects.map((subject, index) => (
                        <View key={index} style={styles.subjectContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <Text style={styles.subjectLabel}>
                              Subject {index + 1}
                            </Text>
                            {values.subjects.length > 1 && (
                              <TouchableOpacity
                                onPress={() => {
                                  const newSubjects = values.subjects.filter(
                                    (_, i) => i !== index
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
                                newSubjects[index].subject_Name = text;
                                setFieldValue("subjects", newSubjects);
                              }}
                              onBlur={() => handleBlur(`subjects[${index}].subject_Name`)}
                              type="text"
                            />
                            {touched.subjects?.[index]?.subject_Name &&
                              errors.subjects?.[index]?.subject_Name && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[index].subject_Name}
                                </Text>
                              )}
    </View>

                          <View style={styles.subjectFieldContainer}>
                            <Text style={styles.subjectFieldLabel}>Date *</Text>
                            <TouchableOpacity
                              onPress={() => {
                                if (subject.date) {
                                  setTempSubjectDate(new Date(subject.date));
                                } else {
                                  setTempSubjectDate(new Date());
                                }
                                setShowSubjectDatePicker(index);
                              }}
                              style={styles.datePickerButton}
                            >
                              <Text
                                style={[
                                  styles.datePickerButtonText,
                                  { color: subject.date ? "#111827" : "#9CA3AF" }
                                ]}
                              >
                                {subject.date || "Select date"}
                              </Text>
                            </TouchableOpacity>
                            {touched.subjects?.[index]?.date &&
                              errors.subjects?.[index]?.date && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[index].date}
                                </Text>
                              )}
                            {/* Date Picker */}
                            {showSubjectDatePicker === index && (
                              <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                  value={tempSubjectDate}
                                  mode="date"
                                  display={Platform.OS === "ios" ? "compact" : "default"}
                                  onChange={(event, selectedDate) => {
                                    if (Platform.OS === "android") {
                                      setShowSubjectDatePicker(null);
                                    }
                                    if (selectedDate) {
                                      setTempSubjectDate(selectedDate);
                                      if (Platform.OS === "android") {
                                        const formattedDate = formatDateForInput(selectedDate);
                                        const newSubjects = [...values.subjects];
                                        newSubjects[index].date = formattedDate;
                                        setFieldValue("subjects", newSubjects);
                                      }
                                    }
                                  }}
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
                                      onPress={() => setShowSubjectDatePicker(null)}
                                      style={styles.datePickerActionButton}
                                    >
                                      <Text style={styles.datePickerCancelText}>
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => {
                                        const formattedDate = formatDateForInput(tempSubjectDate);
                                        const newSubjects = [...values.subjects];
                                        newSubjects[index].date = formattedDate;
                                        setFieldValue("subjects", newSubjects);
                                        setShowSubjectDatePicker(null);
                                      }}
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
                        title={isEditMode ? "Update Datesheet" : "Add Datesheet"}
                        onPress={formikSubmit}
                        bgColor="#8B5CF6"
                        textColor="#FFFFFF"
                        loading={isSubmitting || isLoading}
                      />
                    </View>
                  </View>
                </>
              )}
            </Formik>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default addDatesheet;

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
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  datePickerButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#111827",
  },
  datePickerContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
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
    color: "#8B5CF6",
  },
  subjectContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#8B5CF6",
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
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});
