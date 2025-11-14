import { useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect } from "react";
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
import { useCreateDiaryMutation, useGetDiaryByIdQuery, useUpdateDiaryMutation } from "../../../redux/api/diaryApi";

// Validation Schema
const validationSchema = Yup.object().shape({
  expire_Date: Yup.string().required("Expire date is required"),
  imp_Note: Yup.string()
    .required("Important note is required")
    .min(5, "Important note must be at least 5 characters"),
  subjects: Yup.array()
    .of(
      Yup.object().shape({
        subject_Name: Yup.string().required("Subject name is required"),
        todo: Yup.string().required("Todo is required"),
      })
    )
    .min(1, "At least one subject is required"),
});

const addDiary = () => {
  const router = useRouter();
  const { diaryId } = useLocalSearchParams();
  const isEditMode = !!diaryId;
  const { branchId, user, classId } = useSelector((state) => state.auth);
  const [createDiary, { isLoading: isCreating }] = useCreateDiaryMutation();
  const [updateDiary, { isLoading: isUpdating }] = useUpdateDiaryMutation();
  const { data: diaryData, isLoading: isLoadingDiary, error: diaryError } = useGetDiaryByIdQuery(diaryId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  // Check for errors when loading diary data
  useEffect(() => {
    if (isEditMode && diaryError) {
      Alert.alert("Error", "Failed to load diary data. Please try again.");
    }
  }, [diaryError, isEditMode]);

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getExpireDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      { label: "Only for today", value: formatDateForInput(today) },
      { label: "Tomorrow", value: formatDateForInput(tomorrow) },
    ];
  };

  const handleExpireDateOptionSelect = (option, setFieldValue) => {
    setFieldValue("expire_Date", option.value);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        const updateData = {
          diary_Id: diaryId,
          branch_Id: branchId,
          class_Id: classId || null,
          expire_Date: values.expire_Date,
          imp_Note: values.imp_Note,
          subjects: values.subjects,
        };

        await updateDiary(updateData).unwrap();

        Alert.alert("Success", "Diary entry updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        const createData = {
          branch_Id: branchId,
          class_Id: classId || null,
          created_By: user?.id,
          date: formatDateForInput(new Date()), // Auto-set to today
          expire_Date: values.expire_Date,
          imp_Note: values.imp_Note,
          created_By_Email: user?.email || "", // Auto-set from user
          subjects: values.subjects,
        };

        await createDiary(createData).unwrap();

        Alert.alert("Success", "Diary entry created successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || `Failed to ${isEditMode ? 'update' : 'create'} diary entry. Please try again.`);
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
                {isEditMode ? "Edit Diary Entry" : "Add New Diary Entry"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode 
                  ? "Update the diary entry details below"
                  : "Fill in the details to create a new diary entry"}
              </Text>
            </View>

            {isLoadingDiary ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading diary data...</Text>
              </View>
            ) : (isEditMode && !diaryData) ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Failed to load diary data. Please go back and try again.</Text>
              </View>
            ) : (
            <Formik
              key={isEditMode && diaryData ? `edit-${diaryData.diary_id || diaryData.diary_Id || diaryData.id}` : 'create'}
              initialValues={{
                expire_Date: diaryData?.expire_Date || diaryData?.expire_date || "",
                imp_Note: diaryData?.imp_Note || diaryData?.imp_note || "",
                subjects: (() => {
                  if (!diaryData?.subjects) {
                    return [{ subject_Name: "", todo: "" }];
                  }
                  // Handle both string (JSON) and array formats
                  let subjectsArray = [];
                  try {
                    const subjectsData = diaryData.subjects;
                    subjectsArray = typeof subjectsData === 'string' 
                      ? JSON.parse(subjectsData) 
                      : Array.isArray(subjectsData) ? subjectsData : [];
                  } catch (e) {
                    subjectsArray = [];
                  }
                  return subjectsArray.length > 0 
                    ? subjectsArray.map((subject) => ({
                        subject_Name: subject.subject_Name || subject.subject_name || "",
                        todo: subject.todo || "",
                      }))
                    : [{ subject_Name: "", todo: "" }];
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
                    {/* Expire Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Expire Date *</Text>
                      <View style={styles.expireDateOptions}>
                        {getExpireDateOptions().map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() =>
                              handleExpireDateOptionSelect(option, setFieldValue)
                            }
                            style={[
                              styles.expireDateOptionButton,
                              values.expire_Date === option.value &&
                                styles.expireDateOptionButtonActive,
                              index > 0 && styles.expireDateOptionButtonMargin,
                            ]}
                          >
                            <Text
                              style={[
                                styles.expireDateOptionText,
                                {
                                  color:
                                    values.expire_Date === option.value
                                      ? "#10B981"
                                      : "#6B7280",
                                },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {touched.expire_Date && errors.expire_Date && (
                        <Text style={styles.errorText}>
                          {errors.expire_Date}
                        </Text>
                      )}
                    </View>

                    {/* Important Note */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Important Note *</Text>
                      <Input
                        placeholder="Enter important note"
                        value={values.imp_Note}
                        onChangeText={handleChange("imp_Note")}
                        onBlur={handleBlur("imp_Note")}
                        type="text"
                        multiline={true}
                        numberOfLines={4}
                      />
                      {touched.imp_Note && errors.imp_Note && (
                        <Text style={styles.errorText}>{errors.imp_Note}</Text>
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
                              { subject_Name: "", todo: "" },
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
                            <Text style={styles.subjectFieldLabel}>Todo *</Text>
                            <Input
                              placeholder="Enter todo"
                              value={subject.todo}
                              onChangeText={(text) => {
                                const newSubjects = [...values.subjects];
                                newSubjects[index].todo = text;
                                setFieldValue("subjects", newSubjects);
                              }}
                              onBlur={() => handleBlur(`subjects[${index}].todo`)}
                              type="text"
                              multiline={true}
                              numberOfLines={3}
                            />
                            {touched.subjects?.[index]?.todo &&
                              errors.subjects?.[index]?.todo && (
                                <Text style={styles.errorText}>
                                  {errors.subjects[index].todo}
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
                        title={isEditMode ? "Update Diary" : "Add Diary"}
                        onPress={formikSubmit}
                        bgColor="#10B981"
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

export default addDiary;

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
  expireDateOptions: {
    flexDirection: "row",
    marginBottom: 8,
  },
  expireDateOptionButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  expireDateOptionButtonActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  expireDateOptionButtonMargin: {
    marginLeft: 8,
  },
  expireDateOptionText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    textAlign: "center",
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
