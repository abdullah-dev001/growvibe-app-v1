import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useCreateClassMutation } from '../../../redux/api/classApi';
import { useGetTeachersWithoutClassQuery } from '../../../redux/api/teacherApi';

// Validation Schema
const validationSchema = Yup.object().shape({
  class_Name: Yup.string().required("Class name is required"),
  class_Section: Yup.string().required("Class section is required"),
  class_Status: Yup.boolean().required("Class status is required"),
  class_Incharge: Yup.string().required("Class incharge is required"),
});

const addClass = () => {
  const router = useRouter();
  const { branchId, sessionId, schoolId } = useSelector((state) => state.auth);
  const [createClass] = useCreateClassMutation();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await createClass({
        branch_Id: branchId,
        class_Name: values.class_Name,
        school_Id: schoolId,
        section: values.class_Section,
        session_Id: sessionId,
        class_Status: values.class_Status,
        incharge_Id: values.class_Incharge,
      }).unwrap();

      // Refetch teachers list to update the available teachers
      await refetchTeachersWithoutClass();

      Alert.alert("Success", "Class added successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add class");
    } finally {
      setSubmitting(false);
    }
  };

  const {
    data: teachersWithoutClassData,
    isLoading: teachersWithoutClassLoading,
    error: teachersWithoutClassError,
    refetch: refetchTeachersWithoutClass,
  } = useGetTeachersWithoutClassQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

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
                Add New Class
              </Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to add a new class
              </Text>
            </View>

            <Formik
              initialValues={{
                class_Name: "",
                class_Section: "",
                class_Status: true,
                class_Incharge: "",
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
                    {/* Class Name */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Class Name *
                      </Text>
                      <Input
                        placeholder="Enter class name (e.g., Grade 10)"
                        value={values.class_Name}
                        onChangeText={handleChange("class_Name")}
                        onBlur={handleBlur("class_Name")}
                        type="text"
                      />
                      {touched.class_Name && errors.class_Name && (
                        <Text style={styles.errorText}>
                          {errors.class_Name}
                        </Text>
                      )}
                    </View>

                    {/* Class Section */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Class Section *
                      </Text>
                      <Input
                        placeholder="Enter class section (e.g., A, B, C)"
                        value={values.class_Section}
                        onChangeText={handleChange("class_Section")}
                        onBlur={handleBlur("class_Section")}
                        type="text"
                      />
                      {touched.class_Section && errors.class_Section && (
                        <Text style={styles.errorText}>
                          {errors.class_Section}
                        </Text>
                      )}
                    </View>

                    {/* Class Incharge */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Class Incharge *
                      </Text>
                      <View style={styles.teacherSelector}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.teacherScrollView}
                        >
                          <View style={styles.teacherRow}>
                            {teachersWithoutClassData?.length > 0 ? (
                              teachersWithoutClassData?.map((teacher) => {
                                const teacherAuthId =
                                  teacher?.auth_User_Id ||
                                  teacher?.auth_user_id ||
                                  teacher?.auth_user_Id ||
                                  teacher?.authUserId ||
                                  teacher?.auth_id ||
                                  teacher?.authId;
                                const isSelected =
                                  !!teacherAuthId && values.class_Incharge === teacherAuthId;

                                return (
                                  <TouchableOpacity
                                    key={teacherAuthId || teacher?.id || teacher?.full_Name}
                                    onPress={() => {
                                      if (teacherAuthId) {
                                        setFieldValue("class_Incharge", teacherAuthId);
                                      }
                                    }}
                                    style={[
                                      styles.teacherButton,
                                      isSelected
                                        ? styles.teacherButtonActive
                                        : styles.teacherButtonInactive,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.teacherButtonText,
                                        { color: isSelected ? "#10B981" : "#6B7280" },
                                      ]}
                                    >
                                      {teacher?.full_Name || "Not added yet..."}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })
                            ) : (
                              <Text style={{ fontSize: hp(1.4), fontFamily: "Poppins-Medium", color: "#6B7280" }}>No teachers available</Text>
                            )}
                          </View>
                        </ScrollView>
                      </View>
                      {touched.class_Incharge && errors.class_Incharge && (
                        <Text style={styles.errorText}>
                          {errors.class_Incharge}
                        </Text>
                      )}
                    </View>

                    {/* Class Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Class Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue("class_Status", true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.class_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.class_Status ? "#10B981" : "#6B7280" }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue("class_Status", false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.class_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.class_Status ? "#EF4444" : "#6B7280" }
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
                        title="Add Class"
                        onPress={formikSubmit}
                        bgColor="#1CACF3"
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

export default addClass;

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
  teacherSelector: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  teacherScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teacherRow: {
    flexDirection: "row",
  },
  teacherButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  teacherButtonActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  teacherButtonInactive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  teacherButtonText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
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
});
