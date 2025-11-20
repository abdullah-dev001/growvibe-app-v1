import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useCreateTicketMutation } from '../../../redux/api/ticketApi';

// Validation Schema
const validationSchema = Yup.object().shape({
  ticket_Title: Yup.string()
    .required('Ticket title is required')
    .min(3, 'Ticket title must be at least 3 characters')
    .max(200, 'Ticket title must be less than 200 characters'),
  ticket_Description: Yup.string()
    .required('Ticket description is required')
    .min(10, 'Ticket description must be at least 10 characters')
    .max(1000, 'Ticket description must be less than 1000 characters'),
  ticket_Priority: Yup.string()
    .required('Priority is required')
    .oneOf(['High', 'Medium', 'Low'], 'Priority must be High, Medium, or Low'),
});

const addTicket = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#FEE2E2';
      case 'medium':
        return '#FEF3C7';
      case 'low':
        return '#D1FAE5';
      default:
        return '#F3F4F6';
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const ticketData = {
        ticket_Title: values.ticket_Title,
        ticket_Description: values.ticket_Description,
        ticket_Priority: values.ticket_Priority,
        created_By: user?.id,
      };

      await createTicket(ticketData).unwrap();

      Alert.alert('Success', 'Ticket created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const actualError = error?.data?.data || error?.data || error;
      Alert.alert('Error', actualError.message || error.message || 'Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
              <Text style={styles.headerTitle}>Create New Ticket</Text>
              <Text style={styles.headerSubtitle}>
                Fill in the details to create a new support ticket
              </Text>
            </View>

            <Formik
              initialValues={{
                ticket_Title: '',
                ticket_Description: '',
                ticket_Priority: 'Medium',
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
                    {/* Ticket Title */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Ticket Title *</Text>
                      <Input
                        placeholder="Enter ticket title"
                        value={values.ticket_Title}
                        onChangeText={handleChange('ticket_Title')}
                        onBlur={handleBlur('ticket_Title')}
                        type="text"
                      />
                      {touched.ticket_Title && errors.ticket_Title && (
                        <Text style={styles.errorText}>{errors.ticket_Title}</Text>
                      )}
                    </View>

                    {/* Ticket Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Description *</Text>
                      <Input
                        placeholder="Describe your issue or request in detail"
                        value={values.ticket_Description}
                        onChangeText={handleChange('ticket_Description')}
                        onBlur={handleBlur('ticket_Description')}
                        type="text"
                        multiline={true}
                        numberOfLines={6}
                      />
                      {touched.ticket_Description && errors.ticket_Description && (
                        <Text style={styles.errorText}>{errors.ticket_Description}</Text>
                      )}
                    </View>

                    {/* Priority Selection */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Priority *</Text>
                      <View style={styles.priorityRow}>
                        {['High', 'Medium', 'Low'].map((priority) => (
                          <TouchableOpacity
                            key={priority}
                            onPress={() => setFieldValue('ticket_Priority', priority)}
                            style={[
                              styles.priorityOption,
                              values.ticket_Priority === priority
                                ? styles.priorityOptionActive
                                : styles.priorityOptionInactive,
                              {
                                backgroundColor:
                                  values.ticket_Priority === priority
                                    ? getPriorityBgColor(priority)
                                    : '#F9FAFB',
                                borderColor:
                                  values.ticket_Priority === priority
                                    ? getPriorityColor(priority)
                                    : '#E5E7EB',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityOptionText,
                                {
                                  color:
                                    values.ticket_Priority === priority
                                      ? getPriorityColor(priority)
                                      : '#6B7280',
                                },
                              ]}
                            >
                              {priority}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {touched.ticket_Priority && errors.ticket_Priority && (
                        <Text style={styles.errorText}>{errors.ticket_Priority}</Text>
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
                        title="Create Ticket"
                        onPress={formikSubmit}
                        bgColor="#1CACF3"
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

export default addTicket;

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
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  formFields: {
    // Spacing handled by marginBottom in fieldContainer
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    marginBottom: hp(1),
  },
  errorText: {
    color: '#EF4444',
    fontSize: hp(1.3),
    marginTop: hp(0.5),
    fontFamily: 'Poppins-Regular',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityOptionActive: {
    borderWidth: 2,
  },
  priorityOptionInactive: {
    borderWidth: 1,
  },
  priorityOptionText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
});

