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
  ActivityIndicator,
} from "react-native";
import * as Yup from "yup";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useCreateAuthMutation, useUpdateAuthMutation } from "../../../redux/api/createAuthApi";
import { useGetOwnerByIdQuery } from "../../../redux/api/ownerApi";

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
  name: Yup.string().required("Owner Name is required"),
  owner_Status: Yup.boolean().required("Status is required"),
});

const addOwner = () => {
  const router = useRouter();
  const { ownerId } = useLocalSearchParams();
  const isEditMode = !!ownerId;
  const [createAuth, { isLoading: isCreating }] = useCreateAuthMutation();
  const [updateAuth, { isLoading: isUpdating }] = useUpdateAuthMutation();
  const { data: ownerData, isLoading: isLoadingOwner } = useGetOwnerByIdQuery(ownerId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        // Use auth_User_Id (UUID) for update-auth, not owner_id
        const authId = ownerData?.auth_User_Id || ownerId;
        if (!authId) {
          Alert.alert("Error", "Owner auth ID not available");
          return;
        }
        await updateAuth({
          user_Id: authId,
          email: values.email,
          password: values.password || undefined, // Only send password if provided
          status: values.owner_Status,
          fullName: values.name,
          role: "owner",
        }).unwrap();

        Alert.alert("Success", "Owner updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createAuth({
          email: values.email,
          password: values.password,
          status: values.owner_Status,
          fullName: values.name,
          role: "owner",
        }).unwrap();

        Alert.alert("Success", "Owner added successfully!", [
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
      Alert.alert("Error", error?.message || error?.data?.message || "Failed to save owner");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while fetching owner data
  if (isEditMode && isLoadingOwner) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading owner data...</Text>
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
                {isEditMode ? "Edit Owner" : "Add New Owner"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode
                  ? "Update the owner details"
                  : "Fill in the details to add a new owner"}
              </Text>
            </View>

            <Formik
              key={ownerData?.auth_User_Id || "new"}
              initialValues={{
                email: ownerData?.email || "",
                password: "",
                name: ownerData?.full_Name || "",
                owner_Status: ownerData?.profile_Status !== undefined ? ownerData.profile_Status : true,
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
                  <View style={styles.formFields}>
                    {/* Email */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Email *
                      </Text>
                      <Input
                        placeholder="Enter owner email"
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
                        Owner Name *
                      </Text>
                      <Input
                        placeholder="Enter Owner Name"
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

                    {/* Owner Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Owner Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue("owner_Status", true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.owner_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.owner_Status ? "#10B981" : "#6B7280" }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue("owner_Status", false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.owner_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.owner_Status ? "#EF4444" : "#6B7280" }
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
                        title={isEditMode ? "Update Owner" : "Add Owner"}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default addOwner;

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
