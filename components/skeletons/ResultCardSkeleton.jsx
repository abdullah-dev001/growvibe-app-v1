import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const ResultCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <View style={[styles.skeletonBar, styles.titleSkeleton]} />
          <View style={[styles.skeletonBar, styles.descriptionSkeleton]} />
          <View style={[styles.skeletonBar, styles.dateSkeleton]} />
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.skeletonBar, styles.editButtonSkeleton]} />
          <View style={[styles.skeletonBar, styles.deleteButtonSkeleton]} />
        </View>
      </View>

      {/* Total Marks Section */}
      <View style={styles.totalMarksSection}>
        <View style={[styles.skeletonBar, styles.totalMarksLabelSkeleton]} />
        <View style={[styles.skeletonBar, styles.totalMarksValueSkeleton]} />
      </View>

      {/* Students Section */}
      <View style={styles.studentsSection}>
        <View style={[styles.skeletonBar, styles.studentsLabelSkeleton]} />
        <View style={styles.studentResultItem}>
          <View style={[styles.skeletonBar, styles.studentResultTextSkeleton]} />
          <View style={styles.subjectsContainer}>
            <View style={styles.subjectItem}>
              <View style={[styles.skeletonBar, styles.subjectNameSkeleton]} />
              <View style={[styles.skeletonBar, styles.subjectMarksSkeleton]} />
            </View>
            <View style={styles.subjectItem}>
              <View style={[styles.skeletonBar, styles.subjectNameSkeleton]} />
              <View style={[styles.skeletonBar, styles.subjectMarksSkeleton]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ResultCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  titleSkeleton: {
    height: hp(1.8),
    width: '60%',
    marginBottom: 8,
  },
  descriptionSkeleton: {
    height: hp(1.4),
    width: '80%',
    marginBottom: 4,
  },
  dateSkeleton: {
    height: hp(1.2),
    width: '40%',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButtonSkeleton: {
    height: hp(2.5),
    width: hp(8),
    marginRight: 8,
  },
  deleteButtonSkeleton: {
    height: hp(2.5),
    width: hp(8),
  },
  totalMarksSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  totalMarksLabelSkeleton: {
    height: hp(1.4),
    width: '30%',
  },
  totalMarksValueSkeleton: {
    height: hp(1.6),
    width: '20%',
  },
  studentsSection: {
    marginTop: 8,
  },
  studentsLabelSkeleton: {
    height: hp(1.4),
    width: '25%',
    marginBottom: 12,
  },
  studentResultItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  studentResultTextSkeleton: {
    height: hp(1.4),
    width: '70%',
    marginBottom: 8,
  },
  subjectsContainer: {
    marginTop: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 4,
  },
  subjectNameSkeleton: {
    height: hp(1.3),
    width: '40%',
  },
  subjectMarksSkeleton: {
    height: hp(1.3),
    width: '25%',
  },
});


