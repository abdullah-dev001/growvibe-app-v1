import { useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect } from "react";
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
import { useGetPrincipalByIdQuery } from "../../../redux/api/principalApi";

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
  principal_Status: Yup.boolean().required("Principal status is required"),
  name: Yup.string().required("Principal name is required"),
});

const addPrincipal = () => {
  const router = useRouter();
  const { user, schoolId, branchId } = useSelector((state) => state.auth);
  const { principalId, principalLength } = useLocalSearchParams();
  const isEditMode = !!principalId;
  const [createAuth, { isLoading: isCreating }] = useCreateAuthMutation();
  const [updateAuth, { isLoading: isUpdating }] = useUpdateAuthMutation();
  const { data: principalData, isLoading: isLoadingPrincipal } = useGetPrincipalByIdQuery(principalId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        const authId = principalData?.auth_User_Id || principalId;
        if (!authId) {
          Alert.alert("Error", "Principal auth ID not available");
          return;
        }
        await updateAuth({
          user_Id: authId,
          email: values.email,
          password: values.password || undefined,
          status: values.principal_Status,
          role: "principal",
          school_Id: schoolId,
          branch_Id: branchId,
          fullName: values.name,
        }).unwrap();

        Alert.alert("Success", "Principal updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createAuth({
          email: values.email,
          password: values.password,
          status: values.principal_Status,
          role: "principal",
          school_Id: schoolId,
          branch_Id: branchId,
          fullName: values.name,
        }).unwrap();
        
        Alert.alert("Success", "Principal added successfully!", [
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
      Alert.alert("Error", error?.message || error?.data?.message || "Failed to save principal");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isEditMode && principalLength > 0) {
      Alert.alert("Error", "Principal already exists!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    }
  }, [principalLength, isEditMode]);

  // Show loading state while fetching principal data
  if (isEditMode && isLoadingPrincipal) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading principal data...</Text>
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
                {isEditMode ? "Edit Principal" : "Add New Principal"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode
                  ? "Update the principal details"
                  : "Fill in the details to add a new principal"}
              </Text>
            </View>

            <Formik
              key={principalData?.auth_User_Id || "new"}
              initialValues={{
                email: principalData?.email || "",
                password: "",
                principal_Status: principalData?.profile_Status !== undefined ? principalData.profile_Status : true,
                name: principalData?.full_Name || '',
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
                        placeholder="Enter principal email"
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
                        Principal Name *
                      </Text>
                      <Input
                        placeholder="Enter principal name"
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

                    {/* Principal Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Principal Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() =>
                            setFieldValue("principal_Status", true)
                          }
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.principal_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.principal_Status ? "#10B981" : "#6B7280" }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setFieldValue("principal_Status", false)
                          }
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.principal_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.principal_Status ? "#EF4444" : "#6B7280" }
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
                        title={isEditMode ? "Update Principal" : "Add Principal"}
                        onPress={formikSubmit}
                        bgColor="#7C3AED"
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

export default addPrincipal;

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
