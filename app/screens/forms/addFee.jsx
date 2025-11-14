import { useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import React from "react";
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
import { useCreateFeeMutation } from "../../../redux/api/feeApi";

const validationSchema = Yup.object().shape({
  month: Yup.string().required("Month is required"),
  fee_Status: Yup.string().required("Fee status is required"),
  fee: Yup.number()
    .required("Fee is required")
    .min(0, "Fee must be 0 or greater"),
  remaining_Fee: Yup.number()
    .nullable()
    .min(0, "Remaining fee must be 0 or greater")
    .transform((value, originalValue) => {
      // Convert empty string to null
      return originalValue === "" ? null : value;
    }),
});

const addFee = () => {
  const router = useRouter();
  const { studentId, studentName, branchId: branchIdParam, schoolId: schoolIdParam, classId: classIdParam } = useLocalSearchParams();
  const { branchId: branchIdRedux, schoolId: schoolIdRedux, classId: classIdRedux } = useSelector((state) => state.auth);
  
  // Use params if available, otherwise use Redux values
  const branchId = branchIdParam || branchIdRedux;
  const schoolId = schoolIdParam || schoolIdRedux;
  const classId = classIdParam || classIdRedux;

  const [createFee, { isLoading: isCreating }] = useCreateFeeMutation();

  const feeStatusOptions = ["paid", "pending", "overdue"];

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!studentId || !branchId || !schoolId || !classId) {
        Alert.alert("Error", "Missing required information (student, branch, school, or class)");
        return;
      }

      await createFee({
        branch_Id: Number(branchId),
        student_Id: studentId,
        month: values.month,
        fee_Status: values.fee_Status,
        fee: Number(values.fee),
        remaining_Fee: values.remaining_Fee ? Number(values.remaining_Fee) : null,
        class_Id: Number(classId),
        school_Id: Number(schoolId),
      }).unwrap();

      Alert.alert("Success", "Fee added successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.data?.message || error?.message || "Failed to add fee"
      );
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add Fee</Text>
              <Text style={styles.headerSubtitle}>
                {studentName ? `Add fee for ${studentName}` : "Add fee record"}
              </Text>
            </View>

            <Formik
              initialValues={{
                month: "",
                fee_Status: "pending",
                fee: "",
                remaining_Fee: "",
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
                    {/* Month */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Month *</Text>
                      <Input
                        placeholder="e.g., January 2024"
                        value={values.month}
                        onChangeText={handleChange("month")}
                        onBlur={handleBlur("month")}
                        type="text"
                      />
                      {touched.month && errors.month && (
                        <Text style={styles.errorText}>{errors.month}</Text>
                      )}
                    </View>

                    {/* Fee Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Fee Status *</Text>
                      <View style={styles.statusRow}>
                        {feeStatusOptions.map((status) => (
                          <TouchableOpacity
                            key={status}
                            onPress={() => {
                              setFieldValue("fee_Status", status);
                              setFieldValue("touched", true);
                            }}
                            style={[
                              styles.statusButton,
                              values.fee_Status === status && styles.statusButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                values.fee_Status === status && styles.statusButtonTextActive,
                              ]}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {touched.fee_Status && errors.fee_Status && (
                        <Text style={styles.errorText}>{errors.fee_Status}</Text>
                      )}
                    </View>

                    {/* Fee */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Fee (Rs.) *</Text>
                      <Input
                        placeholder="Enter fee amount"
                        value={values.fee}
                        onChangeText={handleChange("fee")}
                        onBlur={handleBlur("fee")}
                        type="text"
                        keyboardType="numeric"
                      />
                      {touched.fee && errors.fee && (
                        <Text style={styles.errorText}>{errors.fee}</Text>
                      )}
                    </View>

                    {/* Remaining Fee */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Remaining Fee (Rs.)</Text>
                      <Input
                        placeholder="Enter remaining fee amount (optional)"
                        value={values.remaining_Fee}
                        onChangeText={handleChange("remaining_Fee")}
                        onBlur={handleBlur("remaining_Fee")}
                        type="text"
                        keyboardType="numeric"
                      />
                      {touched.remaining_Fee && errors.remaining_Fee && (
                        <Text style={styles.errorText}>{errors.remaining_Fee}</Text>
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
                        title="Add Fee"
                        onPress={formikSubmit}
                        bgColor="#10B981"
                        textColor="#FFFFFF"
                        loading={isSubmitting || isCreating}
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

export default addFee;

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
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtonActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  statusButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    textAlign: "center",
  },
  statusButtonTextActive: {
    color: "#10B981",
    fontFamily: "Poppins-SemiBold",
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

