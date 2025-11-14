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
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useCreateSessionMutation, useGetSessionByIdQuery, useUpdateSessionMutation } from "../../../redux/api/sessionApi";

// Validation Schema Factory
const getValidationSchema = () => Yup.object().shape({
  session_Name: Yup.string().required("Session name is required"),
  session_Start_Date: Yup.string().required("Start date is required"),
  session_End_Date: Yup.string()
    .required("End date is required")
    .test(
      "is-after-start",
      "End date must be after start date",
      function (value) {
        const { session_Start_Date } = this.parent;
        if (!value || !session_Start_Date) return true;
        const startDate = new Date(session_Start_Date);
        const endDate = new Date(value);
        // End date must be after start date (not equal)
        return endDate > startDate;
      }
    ),
  session_Status: Yup.boolean().required("Session status is required"),
});

const addSession = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const isEditMode = !!sessionId;
  const { branchId } = useSelector((state) => state.auth);
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation();
  const { data: sessionData, isLoading: isLoadingSession } = useGetSessionByIdQuery(sessionId, { 
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    sessionData?.session_Start ? new Date(sessionData.session_Start) : new Date()
  );
  const [tempEndDate, setTempEndDate] = useState(
    sessionData?.session_End ? new Date(sessionData.session_End) : new Date()
  );

  // Update temp dates when session data loads
  React.useEffect(() => {
    if (sessionData) {
      if (sessionData.session_Start) {
        setTempStartDate(new Date(sessionData.session_Start));
      }
      if (sessionData.session_End) {
        setTempEndDate(new Date(sessionData.session_End));
      }
    }
  }, [sessionData]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        await updateSession({
          id: sessionId,
          session_Name: values.session_Name,
          session_Start: values.session_Start_Date,
          session_End: values.session_End_Date,
          session_Status: values.session_Status,
          branch_Id: branchId,
        }).unwrap();

        Alert.alert("Success", "Session updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
      await createSession({
        session_Name: values.session_Name,
        session_Start: values.session_Start_Date,
        session_End: values.session_End_Date,
        session_Status: values.session_Status,
        branch_Id: branchId,
      }).unwrap();

      Alert.alert("Success", "Session added successfully!", [
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
      // Extract the actual error from RTK Query error structure
      const actualError = error?.data?.data || error?.data || error;
      
      // Check for duplicate active session constraint violation
      const isDuplicateActiveSession = 
        actualError.code === "23505" || 
        (actualError.message && actualError.message.includes("unique_active_session_per_branch"));
      
      if (isDuplicateActiveSession && values.session_Status) {
        Alert.alert(
          "Active Session Exists",
          "Only one active session is allowed per branch. Please deactivate the existing active session before creating a new one, or create this session as inactive.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", actualError.message || error.message || `Failed to ${isEditMode ? 'update' : 'add'} session`);
      }
    } finally {
      setSubmitting(false);
    }
  };
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentDate = () => {
    return formatDateForInput(new Date());
  };

  const handleStartDateChange = (event, selectedDate, setFieldValue) => {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS === "android") {
        const formattedDate = formatDateForInput(selectedDate);
        setFieldValue("session_Start_Date", formattedDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate, setFieldValue) => {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS === "android") {
        const formattedDate = formatDateForInput(selectedDate);
        setFieldValue("session_End_Date", formattedDate);
      }
    }
  };

  const confirmStartDate = (setFieldValue) => {
    const formattedDate = formatDateForInput(tempStartDate);
    setFieldValue("session_Start_Date", formattedDate);
    setShowStartDatePicker(false);
  };

  const confirmEndDate = (setFieldValue) => {
    const formattedDate = formatDateForInput(tempEndDate);
    setFieldValue("session_End_Date", formattedDate);
    setShowEndDatePicker(false);
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
                {isEditMode ? 'Edit Session' : 'Add New Session'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode ? 'Update the session details' : 'Fill in the details to add a new academic session'}
              </Text>
            </View>

            {isLoadingSession ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading session data...</Text>
              </View>
            ) : (
            <Formik
              initialValues={{
                session_Name: sessionData?.session_Name || "",
                session_Start_Date: sessionData?.session_Start ? formatDateForInput(new Date(sessionData.session_Start)) : "",
                session_End_Date: sessionData?.session_End ? formatDateForInput(new Date(sessionData.session_End)) : "",
                session_Status: sessionData?.session_Status ?? true,
              }}
              enableReinitialize
              validationSchema={getValidationSchema()}
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
                    {/* Session Name */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Session Name *
                      </Text>
                      <Input
                        placeholder="Enter session name (e.g., 2024-2025 Academic Year)"
                        value={values.session_Name}
                        onChangeText={handleChange("session_Name")}
                        onBlur={handleBlur("session_Name")}
                        type="text"
                      />
                      {touched.session_Name && errors.session_Name && (
                        <Text style={styles.errorText}>
                          {errors.session_Name}
                        </Text>
                      )}
                    </View>

                    {/* Session Start Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Start Date *
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (values.session_Start_Date) {
                            setTempStartDate(
                              new Date(values.session_Start_Date)
                            );
                          }
                          setShowStartDatePicker(true);
                        }}
                        style={styles.datePickerButton}
                      >
                        <Text
                          style={[
                            styles.datePickerButtonText,
                            { color: values.session_Start_Date ? "#111827" : "#9CA3AF" }
                          ]}
                        >
                          {values.session_Start_Date || "Select start date"}
                        </Text>
                      </TouchableOpacity>
                      {touched.session_Start_Date &&
                        errors.session_Start_Date && (
                          <Text style={styles.errorText}>
                            {errors.session_Start_Date}
                          </Text>
                        )}
                      {/* Date Picker */}
                      {showStartDatePicker && (
                        <View style={styles.datePickerContainer}>
                          <DateTimePicker
                            value={tempStartDate}
                            mode="date"
                            display={
                              Platform.OS === "ios" ? "compact" : "default"
                            }
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === "android") {
                                setShowStartDatePicker(false);
                              }
                              if (selectedDate) {
                                setTempStartDate(selectedDate);
                                if (Platform.OS === "android") {
                                  const formattedDate =
                                    formatDateForInput(selectedDate);
                                  setFieldValue(
                                    "session_Start_Date",
                                    formattedDate
                                  );
                                } else {
                                  // For iOS, update immediately
                                  const formattedDate =
                                    formatDateForInput(selectedDate);
                                  setFieldValue(
                                    "session_Start_Date",
                                    formattedDate
                                  );
                                }
                              }
                            }}
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
                                onPress={() => setShowStartDatePicker(false)}
                                style={styles.datePickerActionButton}
                              >
                                <Text style={styles.datePickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  const formattedDate =
                                    formatDateForInput(tempStartDate);
                                  setFieldValue(
                                    "session_Start_Date",
                                    formattedDate
                                  );
                                  setShowStartDatePicker(false);
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

                    {/* Session End Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        End Date *
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (values.session_End_Date) {
                            setTempEndDate(new Date(values.session_End_Date));
                          }
                          setShowEndDatePicker(true);
                        }}
                        style={styles.datePickerButton}
                      >
                        <Text
                          style={[
                            styles.datePickerButtonText,
                            { color: values.session_End_Date ? "#111827" : "#9CA3AF" }
                          ]}
                        >
                          {values.session_End_Date || "Select end date"}
                        </Text>
                      </TouchableOpacity>
                      {touched.session_End_Date && errors.session_End_Date && (
                        <Text style={styles.errorText}>
                          {errors.session_End_Date}
                        </Text>
                      )}
                      {/* Date Picker */}
                      {showEndDatePicker && (
                        <View style={styles.datePickerContainer}>
                          <DateTimePicker
                            value={tempEndDate}
                            mode="date"
                            display={
                              Platform.OS === "ios" ? "compact" : "default"
                            }
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === "android") {
                                setShowEndDatePicker(false);
                              }
                              if (selectedDate) {
                                setTempEndDate(selectedDate);
                                if (Platform.OS === "android") {
                                  const formattedDate =
                                    formatDateForInput(selectedDate);
                                  setFieldValue(
                                    "session_End_Date",
                                    formattedDate
                                  );
                                } else {
                                  // For iOS, update immediately
                                  const formattedDate =
                                    formatDateForInput(selectedDate);
                                  setFieldValue(
                                    "session_End_Date",
                                    formattedDate
                                  );
                                }
                              }
                            }}
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
                                onPress={() => setShowEndDatePicker(false)}
                                style={styles.datePickerActionButton}
                              >
                                <Text style={styles.datePickerCancelText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  const formattedDate =
                                    formatDateForInput(tempEndDate);
                                  setFieldValue(
                                    "session_End_Date",
                                    formattedDate
                                  );
                                  setShowEndDatePicker(false);
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

                    {/* Session Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Session Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue("session_Status", true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.session_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.session_Status ? "#10B981" : "#6B7280" }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue("session_Status", false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.session_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.session_Status ? "#EF4444" : "#6B7280" }
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
                      title={isEditMode ? "Update Session" : "Add Session"}
                      onPress={formikSubmit}
                      bgColor="#10B981"
                      textColor="#FFFFFF"
                      className="flex-1"
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

export default addSession;

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
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
});
