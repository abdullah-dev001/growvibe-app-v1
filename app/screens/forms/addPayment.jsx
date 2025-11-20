import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useCreatePaymentMutation } from '../../../redux/api/paymentApi';

// Validation Schema
const validationSchema = Yup.object().shape({
  payment_Method: Yup.string().required('Payment method is required'),
  remaining_Due: Yup.number().nullable().min(0, 'Remaining due must be 0 or greater'),
  payment_Status: Yup.boolean().required('Payment status is required'),
  payment_Description: Yup.string().required('Payment description is required'),
  month: Yup.string().required('Month is required'),
  fee: Yup.number().required('Fee is required').min(0, 'Fee must be 0 or greater'),
});

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Check', 'Other'];

const addPayment = () => {
  const router = useRouter();
  const { schoolId, schoolName } = useLocalSearchParams();
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await createPayment({
        school_Id: Number(schoolId),
        payment_Method: values.payment_Method,
        remaining_Due: values.remaining_Due ? Number(values.remaining_Due) : null,
        payment_Status: values.payment_Status,
        payment_Description: values.payment_Description,
        month: values.month,
        fee: Number(values.fee),
      }).unwrap();

      Alert.alert('Success', 'Payment added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.data?.message || error?.message || 'Failed to add payment');
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Payment</Text>
              <Text style={styles.headerSubtitle}>{schoolName || 'School Payment'}</Text>
            </View>

            <Formik
              initialValues={{
                payment_Method: '',
                remaining_Due: '',
                payment_Status: true,
                payment_Description: '',
                month: '',
                fee: '',
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
                    {/* Payment Method */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Payment Method *</Text>
                      <View style={styles.selectorContainer}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.selectorScrollView}
                        >
                          <View style={styles.selectorRow}>
                            {paymentMethods.map((method) => {
                              const isSelected = values.payment_Method === method;
                              return (
                                <TouchableOpacity
                                  key={method}
                                  onPress={() => setFieldValue('payment_Method', method)}
                                  style={[
                                    styles.selectorButton,
                                    isSelected ? styles.selectorButtonActive : styles.selectorButtonInactive,
                                  ]}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.selectorButtonText,
                                      { color: isSelected ? '#F59E0B' : '#6B7280' },
                                    ]}
                                  >
                                    {method}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                      {touched.payment_Method && errors.payment_Method && (
                        <Text style={styles.errorText}>{errors.payment_Method}</Text>
                      )}
                    </View>

                    {/* Month */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Month *</Text>
                      <View style={styles.selectorContainer}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.selectorScrollView}
                        >
                          <View style={styles.selectorRow}>
                            {months.map((month) => {
                              const isSelected = values.month === month;
                              return (
                                <TouchableOpacity
                                  key={month}
                                  onPress={() => setFieldValue('month', month)}
                                  style={[
                                    styles.selectorButton,
                                    isSelected ? styles.selectorButtonActive : styles.selectorButtonInactive,
                                  ]}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.selectorButtonText,
                                      { color: isSelected ? '#F59E0B' : '#6B7280' },
                                    ]}
                                  >
                                    {month}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                      {touched.month && errors.month && (
                        <Text style={styles.errorText}>{errors.month}</Text>
                      )}
                    </View>

                    {/* Fee */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Fee *</Text>
                      <Input
                        placeholder="Enter fee amount"
                        value={values.fee}
                        onChangeText={handleChange('fee')}
                        onBlur={handleBlur('fee')}
                        type="numeric"
                        keyboardType="numeric"
                      />
                      {touched.fee && errors.fee && (
                        <Text style={styles.errorText}>{errors.fee}</Text>
                      )}
                    </View>

                    {/* Remaining Due (Optional) */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Remaining Due (Optional)</Text>
                      <Input
                        placeholder="Enter remaining due amount"
                        value={values.remaining_Due}
                        onChangeText={handleChange('remaining_Due')}
                        onBlur={handleBlur('remaining_Due')}
                        type="numeric"
                        keyboardType="numeric"
                      />
                      {touched.remaining_Due && errors.remaining_Due && (
                        <Text style={styles.errorText}>{errors.remaining_Due}</Text>
                      )}
                    </View>

                    {/* Payment Description */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Payment Description *</Text>
                      <Input
                        placeholder="Enter payment description"
                        value={values.payment_Description}
                        onChangeText={handleChange('payment_Description')}
                        onBlur={handleBlur('payment_Description')}
                        type="text"
                        multiline
                        numberOfLines={3}
                      />
                      {touched.payment_Description && errors.payment_Description && (
                        <Text style={styles.errorText}>{errors.payment_Description}</Text>
                      )}
                    </View>

                    {/* Payment Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Payment Status *</Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue('payment_Status', true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.payment_Status ? styles.statusButtonActive : styles.statusButtonInactive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.payment_Status ? '#10B981' : '#6B7280' },
                            ]}
                          >
                            Paid
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue('payment_Status', false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.payment_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.payment_Status ? '#EF4444' : '#6B7280' },
                            ]}
                          >
                            Pending
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
                        title={isCreating || isSubmitting ? 'Adding...' : 'Add Payment'}
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

export default addPayment;

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
    // gap handled by marginBottom in fieldContainer
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
  selectorContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectorScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorRow: {
    flexDirection: 'row',
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  selectorButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  selectorButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  selectorButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  statusButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  statusButtonInactiveRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: hp(1.3),
    marginTop: hp(0.5),
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

