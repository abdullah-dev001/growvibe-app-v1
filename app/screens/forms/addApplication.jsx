import { decode } from "base64-arraybuffer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
import { resolveApplicationAssignedTo, useCreateApplicationMutation } from "../../../redux/api/applicationApi";
import { supabase } from "../../../supabaseClient";

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
});

const addApplication = () => {
  const router = useRouter();
  const { user, schoolId, branchId, classId } = useSelector((state) => state.auth);
  const [createApplication, { isLoading: isCreating }] = useCreateApplicationMutation();
  const [attachment, setAttachment] = useState(null);

  const role = user?.role;
  const authId = user?.id;

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to select images");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (!asset) return;

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("Error", "File size must be less than 5MB");
        return;
      }

      // Get file extension from URI or use default
      const uriParts = asset.uri.split(".");
      const fileExt = uriParts.length > 1 ? `.${uriParts[uriParts.length - 1]}` : ".jpg";
      const fileName = `image-${Date.now()}${fileExt}`;

      setAttachment({
        uri: asset.uri,
        name: fileName,
        size: asset.fileSize || 0,
        type: asset.mimeType || "image/jpeg",
      });
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to pick image");
    }
  };

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      if (!file) return;

      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert("Error", "File size must be less than 5MB");
        return;
      }

      setAttachment({
        uri: file.uri,
        name: file.name || "document.pdf",
        size: file.size,
        type: file.mimeType || "application/pdf",
      });
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to pick PDF");
    }
  };

  const handlePickAttachment = () => {
    Alert.alert(
      "Select Attachment Type",
      "Choose the type of file you want to attach",
      [
        {
          text: "Image",
          onPress: handlePickImage,
        },
        {
          text: "PDF",
          onPress: handlePickPDF,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const uploadAttachmentIfNeeded = async () => {
    if (!attachment) return null;
    if (!schoolId) {
      Alert.alert("Error", "SchoolId is required to upload attachments");
      return null;
    }

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Selected file no longer exists. Please select the file again.");
        return null;
      }

      // Read file as base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        Alert.alert("Error", "Failed to read file content. The file may be corrupted or inaccessible.");
        return null;
      }

      // Convert base64 to ArrayBuffer using base64-arraybuffer
      let arrayBuffer;
      try {
        arrayBuffer = decode(base64);
      } catch (decodeError) {
        Alert.alert("Error", "Failed to process file for upload. Please try a different file.");
        return null;
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        Alert.alert("Error", "File is empty or could not be processed.");
        return null;
      }

      const branchPart = branchId ? `branch${branchId}` : "branch-general";
      const fileExt = attachment.name.includes(".")
        ? attachment.name.substring(attachment.name.lastIndexOf("."))
        : "";
      const filePath = `school${schoolId}/${branchPart}/application-${Date.now()}${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("application-docs")
        .upload(filePath, arrayBuffer, {
          contentType: attachment.type || "application/octet-stream",
          upsert: false,
        });

      if (error) {
        // Show detailed error message
        const errorMsg = error.message || "Unknown error occurred";
        Alert.alert(
          "Upload Failed",
          `Could not upload attachment: ${errorMsg}\n\nThe application will be created without the attachment.`,
          [{ text: "OK" }]
        );
        return null;
      }

      if (!data) {
        Alert.alert(
          "Upload Warning",
          "Upload completed but no confirmation received. The application will be created, but the attachment may not be available."
        );
        return null;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("application-docs")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        Alert.alert(
          "Upload Warning",
          "File uploaded but public URL could not be generated. The application will be created."
        );
        return filePath; // Return the path as fallback
      }

      return publicUrl;
    } catch (e) {
      const errorMessage = e?.message || "Unknown error occurred";
      Alert.alert(
        "Upload Error",
        `Failed to upload attachment: ${errorMessage}\n\nThe application will be created without the attachment.`,
        [{ text: "OK" }]
      );
      return null;
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!authId || !role) {
        Alert.alert("Error", "User information is missing");
        return;
      }

      const assignedTo = await resolveApplicationAssignedTo({
        role,
        schoolId,
        branchId,
        classId,
      });

      if (!assignedTo && role !== "owner") {
        Alert.alert(
          "Error",
          "Could not resolve the person to assign this application to."
        );
        return;
      }

      const attachmentUrl = await uploadAttachmentIfNeeded();

      await createApplication({
        school_Id: schoolId || null,
        branch_Id: branchId || null,
        created_By: authId,
        title: values.title,
        description: values.description,
        assigned_To: assignedTo,
        status: "pending",
        attachment_Url: attachmentUrl,
      }).unwrap();

      Alert.alert("Success", "Application created successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            setAttachment(null);
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.data?.message || error?.message || "Failed to create application"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Owners cannot create applications
  if (role === "owner") {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { paddingHorizontal: 16 }]}>
          <Text style={styles.headerTitle}>Applications</Text>
          <Text style={styles.errorText}>
            Owners cannot create applications. You can only review and update
            application statuses.
          </Text>
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Application</Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new application
              </Text>
            </View>

            <Formik
              initialValues={{
                title: "",
                description: "",
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
                handleSubmit: formikSubmit,
                isSubmitting,
              }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Title *</Text>
                      <Input
                        placeholder="Enter application title"
                        value={values.title}
                        onChangeText={handleChange("title")}
                        onBlur={handleBlur("title")}
                        type="text"
                      />
                      {touched.title && errors.title && (
                        <Text style={styles.errorText}>{errors.title}</Text>
                      )}
                    </View>

                    {/* Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Description *</Text>
                      <Input
                        placeholder="Describe your issue or request"
                        value={values.description}
                        onChangeText={handleChange("description")}
                        onBlur={handleBlur("description")}
                        type="text"
                        multiline
                        numberOfLines={4}
                      />
                      {touched.description && errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                      )}
                    </View>

                    {/* Attachment */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Attachment (Optional)</Text>
                      
                      {/* Image Preview */}
                      {attachment && attachment.type?.startsWith("image/") && (
                        <View style={styles.imagePreviewContainer}>
                          <Image
                            source={{ uri: attachment.uri }}
                            cachePolicy="disk"
                            style={styles.imagePreview}
                            contentFit="cover"
                            transition={200}
                          />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => setAttachment(null)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.removeImageText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* PDF Preview */}
                      {attachment && attachment.type === "application/pdf" && (
                        <View style={styles.pdfPreviewContainer}>
                          <Text style={styles.pdfIcon}>📄</Text>
                          <Text style={styles.pdfName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <TouchableOpacity
                            style={styles.removePdfButton}
                            onPress={() => setAttachment(null)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.removePdfText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Attachment Picker Button */}
                      {!attachment && (
                        <TouchableOpacity
                          onPress={handlePickAttachment}
                          style={styles.attachmentPicker}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.attachmentPickerText}>
                            Upload image or PDF (max 5MB)
                          </Text>
                        </TouchableOpacity>
                      )}

                      {attachment && (
                        <TouchableOpacity
                          onPress={handlePickAttachment}
                          style={styles.changeAttachmentButton}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.changeAttachmentText}>
                            Change Attachment
                          </Text>
                        </TouchableOpacity>
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
                        className="flex-1"
                      />
                    </View>
                    <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                      <Button
                        title={isCreating || isSubmitting ? "Adding..." : "Add Application"}
                        onPress={formikSubmit}
                        bgColor="#F59E0B"
                        textColor="#FFFFFF"
                        className="flex-1"
                        loading={isCreating || isSubmitting}
                        disabled={isCreating || isSubmitting}
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

export default addApplication;

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
    paddingBottom: 32,
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
  attachmentPicker: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
  },
  attachmentPickerText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  imagePreviewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  removeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
    alignSelf: "flex-start",
  },
  removeImageText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#DC2626",
  },
  pdfPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
    marginBottom: 8,
  },
  pdfIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pdfName: {
    flex: 1,
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#111827",
  },
  removePdfButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
    marginLeft: 8,
  },
  removePdfText: {
    fontSize: hp(1.3),
    fontFamily: "Poppins-Medium",
    color: "#DC2626",
  },
  changeAttachmentButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
  },
  changeAttachmentText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#2563EB",
  },
  errorText: {
    color: "#EF4444",
    fontSize: hp(1.3),
    marginTop: hp(0.5),
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


