import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import {
    useGetAttendanceSettingQuery,
    useUpsertAttendanceSettingMutation,
} from '../../redux/api/attendanceSettingApi';

const HOLIDAY_OPTIONS = [
  { id: 0, label: 'No Holiday' },
  { id: 1, label: 'Sunday' },
  { id: 2, label: 'Saturday & Sunday' },
];

const AttendanceSettingScreen = () => {
  const router = useRouter();
  const { schoolId, branchId, branchName } = useLocalSearchParams();

  const numericSchoolId = schoolId ? Number(schoolId) : undefined;
  const numericBranchId = branchId ? Number(branchId) : undefined;

  const {
    data: existingSetting,
    isLoading,
    refetch,
  } = useGetAttendanceSettingQuery(
    { schoolId: numericSchoolId, branchId: numericBranchId },
    { skip: !numericSchoolId || !numericBranchId }
  );

  const [selectedHoliday, setSelectedHoliday] = useState('');
  const [upsertSetting, { isLoading: isSaving }] = useUpsertAttendanceSettingMutation();

  const initialHoliday = useMemo(() => {
    if (existingSetting && typeof existingSetting.holiday === 'number') {
      return String(existingSetting.holiday);
    }
    return '';
  }, [existingSetting]);

  useEffect(() => {
    setSelectedHoliday(initialHoliday);
  }, [initialHoliday]);

  const handleSave = async () => {
    if (!numericSchoolId || !numericBranchId) {
      Alert.alert('Error', 'Missing school or branch information.');
      return;
    }
    if (selectedHoliday === '') {
      Alert.alert('Select Holiday', 'Please choose a weekly holiday option.');
      return;
    }

    try {
      await upsertSetting({
        school_Id: numericSchoolId,
        branch_Id: numericBranchId,
        holiday: Number(selectedHoliday),
      }).unwrap();

      Alert.alert('Success', 'Attendance setting saved successfully.', [
        {
          text: 'OK',
          onPress: () => {
            refetch();
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.data?.message || 'Failed to save setting.');
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Attendance Setting</Text>
          <Text style={styles.subtitle}>
            {branchName ? `Branch: ${branchName}` : 'Configure weekly holidays'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Weekly Holiday</Text>
          <Text style={styles.sectionSubtitle}>
            Select which weekly holiday should be excluded from attendance.
          </Text>

          <View style={styles.optionsContainer}>
            {HOLIDAY_OPTIONS.map((option) => {
              const isActive = String(option.id) === selectedHoliday;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isActive && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedHoliday(String(option.id))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isActive && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title={isSaving ? 'Saving...' : 'Save Setting'}
          onPress={handleSave}
          bgColor="#1CACF3"
          textColor="#FFFFFF"
          disabled={isSaving || isLoading}
        />
      </View>
    </ScreenWrapper>
  );
};

export default AttendanceSettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: hp(2.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: hp(1.9),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  optionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionButtonActive: {
    borderColor: '#1CACF3',
    backgroundColor: '#E0F2FE',
  },
  optionLabel: {
    fontSize: hp(1.7),
    fontFamily: 'Poppins-Medium',
    color: '#1F2937',
  },
  optionLabelActive: {
    color: '#0C4A6E',
  },
});

