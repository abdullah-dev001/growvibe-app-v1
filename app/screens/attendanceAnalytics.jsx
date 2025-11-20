import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { useLazyGetStudentMonthlyAnalyticsQuery } from '../../redux/api/attendanceApi';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const attendanceAnalytics = () => {
  const router = useRouter();
  const { user, classId } = useSelector((state) => state.auth);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [triggerAnalytics] = useLazyGetStudentMonthlyAnalyticsQuery();

  // Generate available months (disable future months)
  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();
    const currentMonthNum = today.getMonth() + 1;
    const currentYearNum = today.getFullYear();

    for (let year = currentYearNum; year >= currentYearNum - 2; year--) {
      const startMonth = year === currentYearNum ? currentMonthNum : 12;
      for (let month = startMonth; month >= 1; month--) {
        months.push({ month, year });
      }
    }
    return months;
  };

  const isMonthDisabled = (month, year) => {
    const today = new Date();
    const currentMonthNum = today.getMonth() + 1;
    const currentYearNum = today.getFullYear();
    
    if (year > currentYearNum) return true;
    if (year === currentYearNum && month > currentMonthNum) return true;
    return false;
  };

  const handleViewAnalytics = async () => {
    if (!classId || !user?.id) {
      Alert.alert('Error', 'Required information is missing');
      return;
    }

    setIsLoading(true);
    try {
      const result = await triggerAnalytics({
        p_class_id: classId,
        p_user_id: user.id,
        p_role: 'student',
        p_month: selectedMonth,
        p_year: selectedYear,
      }).unwrap();

      setAnalyticsData(result);
    } catch (error) {
      Alert.alert('Error', error?.data?.message || error?.message || 'Failed to fetch analytics');
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const availableMonths = getAvailableMonths();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attendance Analytics</Text>
          <Text style={styles.headerSubtitle}>
            View detailed monthly attendance statistics
          </Text>
        </View>

        {/* Month/Year Selector - Horizontal Scroll */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>Select Month & Year</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContent}
          >
            {availableMonths.map(({ month, year }, index) => {
              const isSelected = selectedMonth === month && selectedYear === year;
              const isDisabled = isMonthDisabled(month, year);
              
              return (
                <TouchableOpacity
                  key={`${year}-${month}-${index}`}
                  onPress={() => {
                    if (!isDisabled) {
                      setSelectedMonth(month);
                      setSelectedYear(year);
                      setAnalyticsData(null); // Reset analytics when month changes
                    }
                  }}
                  disabled={isDisabled}
                  style={[
                    styles.monthButton,
                    isSelected && styles.monthButtonSelected,
                    isDisabled && styles.monthButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      isSelected && styles.monthButtonTextSelected,
                      isDisabled && styles.monthButtonTextDisabled,
                    ]}
                  >
                    {monthNames[month - 1].substring(0, 3)}
                  </Text>
                  <Text
                    style={[
                      styles.monthButtonYear,
                      isSelected && styles.monthButtonTextSelected,
                      isDisabled && styles.monthButtonTextDisabled,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* View Analytics Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="View Analytics"
            onPress={handleViewAnalytics}
            bgColor="#8B5CF6"
            textColor="#FFFFFF"
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        {/* Analytics Display */}
        {analyticsData && (
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsTitle}>
              Analytics for {monthNames[selectedMonth - 1]} {selectedYear}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statCircle, styles.statCircleGreen]}>
                  <Text style={styles.statCircleText}>
                    {analyticsData.present_percent?.toFixed(1) || 0}%
                  </Text>
                </View>
                <Text style={styles.statLabel}>Present</Text>
                <Text style={styles.statCount}>
                  {analyticsData.present || 0}/{analyticsData.total_days || 0}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statCircle, styles.statCircleRed]}>
                  <Text style={styles.statCircleText}>
                    {analyticsData.absent_percent?.toFixed(1) || 0}%
                  </Text>
                </View>
                <Text style={styles.statLabel}>Absent</Text>
                <Text style={styles.statCount}>{analyticsData.absent || 0}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statCircle, styles.statCircleOrange]}>
                  <Text style={styles.statCircleText}>
                    {analyticsData.late_percent?.toFixed(1) || 0}%
                  </Text>
                </View>
                <Text style={styles.statLabel}>Late</Text>
                <Text style={styles.statCount}>{analyticsData.late || 0}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statCircle, styles.statCircleBlue]}>
                  <Text style={styles.statCircleText}>
                    {analyticsData.leave_percent?.toFixed(1) || 0}%
                  </Text>
                </View>
                <Text style={styles.statLabel}>Leave</Text>
                <Text style={styles.statCount}>{analyticsData.leave || 0}</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Days:</Text>
                <Text style={styles.summaryValue}>{analyticsData.total_days || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Present:</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {analyticsData.present || 0}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Absent:</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  {analyticsData.absent || 0}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Late:</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {analyticsData.late || 0}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Leave:</Text>
                <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                  {analyticsData.leave || 0}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!analyticsData && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Select a month and year, then click "View Analytics" to see your attendance statistics.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default attendanceAnalytics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  monthScrollContent: {
    paddingRight: 16,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  monthButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  monthButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  monthButtonText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 2,
  },
  monthButtonTextSelected: {
    color: '#FFFFFF',
  },
  monthButtonTextDisabled: {
    color: '#9CA3AF',
  },
  monthButtonYear: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  analyticsContainer: {
    marginTop: 8,
  },
  analyticsTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCircle: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(6),
    width: hp(6),
    marginBottom: 8,
  },
  statCircleGreen: {
    backgroundColor: '#10B981',
  },
  statCircleRed: {
    backgroundColor: '#EF4444',
  },
  statCircleOrange: {
    backgroundColor: '#F59E0B',
  },
  statCircleBlue: {
    backgroundColor: '#3B82F6',
  },
  statCircleText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: hp(1.6),
  },
  statLabel: {
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
    fontSize: hp(1.5),
    marginBottom: 4,
  },
  statCount: {
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.3),
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
