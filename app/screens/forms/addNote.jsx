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
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useGetClassesByBranchQuery } from "../../../redux/api/classApi";
import { useCreateNoteMutation } from "../../../redux/api/noteApi";

// Validation Schema
const validationSchema = Yup.object().shape({
  note_Title: Yup.string()
    .required("Note title is required")
    .min(3, "Note title must be at least 3 characters")
    .max(200, "Note title must be less than 200 characters"),
  note_Description: Yup.string()
    .required("Note description is required")
    .min(10, "Note description must be at least 10 characters")
    .max(1000, "Note description must be less than 1000 characters"),
  expire_Date: Yup.string().required("Expire date is required"),
  is_For_Entire_Branch: Yup.boolean().required(
    "Please specify target audience"
  ),
  specific_Class: Yup.string().when("is_For_Entire_Branch", {
    is: false,
    then: (schema) => schema.required("Please select a class"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const addNote = () => {
  const router = useRouter();
  const { branchId, user, schoolId } = useSelector((state) => state.auth);
  const [createNote] = useCreateNoteMutation();
  const [showExpireDatePicker, setShowExpireDatePicker] = useState(false);
  const [tempExpireDate, setTempExpireDate] = useState(new Date());

  // Fetch classes when not for entire branch
  const {
    data: classesData,
    isLoading: classesLoading,
  } = useGetClassesByBranchQuery(branchId, {
    skip: !branchId,
  });

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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await createNote({
        note_Title: values.note_Title,
        note_Description: values.note_Description,
        expire_Date: values.expire_Date,
        created_By: user?.id,
        created_By_Name: user?.email || user?.name || "Unknown",
        created_By_Role: user?.role,
        is_For_Entire_Branch: values.is_For_Entire_Branch,
        specific_Class: values.is_For_Entire_Branch ? null : values.specific_Class,
        branch_Id: branchId,
        school_Id: schoolId,
      }).unwrap();

      Alert.alert("Success", "Note added successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      const actualError = error?.data?.data || error?.data || error;
      console.error("Failed to create note:", error);
      Alert.alert("Error", actualError.message || error.message || "Failed to add note");
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Add New Note
              </Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new note or announcement
              </Text>
            </View>

            <Formik
              initialValues={{
                note_Title: "",
                note_Description: "",
                expire_Date: "",
                is_For_Entire_Branch: true,
                specific_Class: "",
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
              }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Note Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Note Title *
                      </Text>
                      <Input
                        placeholder="Enter note title"
                        value={values.note_Title}
                        onChangeText={handleChange("note_Title")}
                        onBlur={handleBlur("note_Title")}
                        type="text"
                      />
                      {touched.note_Title && errors.note_Title && (
                        <Text style={styles.errorText}>
                          {errors.note_Title}
                        </Text>
                      )}
                    </View>

                    {/* Note Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Note Description *
                      </Text>
                      <Input
                        placeholder="Enter note description"
                        value={values.note_Description}
                        onChangeText={handleChange("note_Description")}
                        onBlur={handleBlur("note_Description")}
                        type="text"
                        multiline={true}
                        numberOfLines={5}
                      />
                      {touched.note_Description && errors.note_Description && (
                        <Text style={styles.errorText}>
                          {errors.note_Description}
                        </Text>
                      )}
                    </View>

                    {/* Expire Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Expire Date *
                      </Text>
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
                            display={
                              Platform.OS === "ios" ? "compact" : "default"
                            }
                            onChange={(event, selectedDate) =>
                              handleExpireDateChange(
                                event,
                                selectedDate,
                                setFieldValue
                              )
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
                                style={[styles.datePickerActionButton, styles.datePickerActionButtonMargin]}
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

                    {/* Target Audience */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Target Audience *
                      </Text>
                      <View style={styles.targetAudienceRow}>
                        <TouchableOpacity
                          onPress={() => {
                            setFieldValue("is_For_Entire_Branch", true);
                            setFieldValue("specific_Class", "");
                          }}
                          style={[
                            styles.targetAudienceButton,
                            { flex: 1 },
                            values.is_For_Entire_Branch
                              ? styles.targetAudienceButtonActive
                              : styles.targetAudienceButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.targetAudienceButtonText,
                              {
                                color: values.is_For_Entire_Branch
                                  ? "#8B5CF6"
                                  : "#6B7280",
                              }
                            ]}
                          >
                            Entire Branch
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setFieldValue("is_For_Entire_Branch", false)
                          }
                          style={[
                            styles.targetAudienceButton,
                            { flex: 1, marginLeft: 12 },
                            !values.is_For_Entire_Branch
                              ? styles.targetAudienceButtonActive
                              : styles.targetAudienceButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.targetAudienceButtonText,
                              {
                                color: !values.is_For_Entire_Branch
                                  ? "#8B5CF6"
                                  : "#6B7280",
                              }
                            ]}
                          >
                            Specific Class
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {touched.is_For_Entire_Branch &&
                        errors.is_For_Entire_Branch && (
                          <Text style={styles.errorText}>
                            {errors.is_For_Entire_Branch}
                          </Text>
                        )}
                    </View>

                    {/* Class Selection - Only show if not for entire branch */}
                    {!values.is_For_Entire_Branch && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>
                          Select Class *
                        </Text>
                        {classesLoading ? (
                          <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                              Loading classes...
                            </Text>
                          </View>
                        ) : classesData && classesData.length > 0 ? (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.classScrollView}
                          >
                            <View style={styles.classRow}>
                              {classesData.map((classItem) => (
                                <TouchableOpacity
                                  key={classItem.class_id || classItem.id}
                                  onPress={() =>
                                    setFieldValue(
                                      "specific_Class",
                                      classItem.class_id || classItem.id
                                    )
                                  }
                                  style={[
                                    styles.classButton,
                                    values.specific_Class ===
                                    (classItem.class_id || classItem.id)
                                      ? styles.classButtonActive
                                      : styles.classButtonInactive
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.classButtonText,
                                      {
                                        color:
                                          values.specific_Class ===
                                          (classItem.class_id || classItem.id)
                                            ? "#8B5CF6"
                                            : "#6B7280",
                                      }
                                    ]}
                                  >
                                    {classItem.class_Name
                                      ? `${classItem.class_Name}${
                                          classItem.section
                                            ? ` - ${classItem.section}`
                                            : ""
                                        }`
                                      : `Class ${classItem.class_id || classItem.id}`}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </ScrollView>
                        ) : (
                          <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                              No classes available
                            </Text>
                          </View>
                        )}
                        {touched.specific_Class && errors.specific_Class && (
                          <Text style={styles.errorText}>
                            {errors.specific_Class}
                          </Text>
                        )}
                      </View>
                    )}
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
                        title="Add Note"
                        onPress={formikSubmit}
                        bgColor="#8B5CF6"
                        textColor="#FFFFFF"
                        className="flex-1"
                        loading={isSubmitting}
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

export default addNote;

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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  datePickerButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 8,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  datePickerActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerActionButtonMargin: {
    marginLeft: 12,
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
  targetAudienceRow: {
    flexDirection: "row",
  },
  targetAudienceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  targetAudienceButtonActive: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  targetAudienceButtonInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  targetAudienceButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
  },
  classScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  classRow: {
    flexDirection: "row",
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  classButtonActive: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  classButtonInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  classButtonText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
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
