import React from 'react';
import { StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const DatesheetCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <View style={[styles.skeletonBar, styles.titleSkeleton]} />
          <View style={[styles.skeletonBar, styles.descriptionSkeleton]} />
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.skeletonBar, styles.editButtonSkeleton]} />
          <View style={[styles.skeletonBar, styles.deleteButtonSkeleton]} />
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.descriptionSection}>
        <View style={[styles.skeletonBar, styles.descriptionLabelSkeleton]} />
        <View style={[styles.skeletonBar, styles.descriptionTextSkeleton]} />
        <View style={[styles.skeletonBar, styles.descriptionTextSkeleton, { width: '80%' }]} />
      </View>

      {/* Expire Date */}
      <View style={styles.expireDateSection}>
        <View style={[styles.skeletonBar, styles.expireDateLabelSkeleton]} />
        <View style={[styles.skeletonBar, styles.expireDateValueSkeleton]} />
      </View>

      {/* Subjects Section */}
      <View style={styles.subjectsSection}>
        <View style={[styles.skeletonBar, styles.subjectsLabelSkeleton]} />
        <View style={styles.subjectItem}>
          <View style={[styles.skeletonBar, styles.subjectNameSkeleton]} />
          <View style={[styles.skeletonBar, styles.subjectDateSkeleton]} />
        </View>
        <View style={styles.subjectItem}>
          <View style={[styles.skeletonBar, styles.subjectNameSkeleton]} />
          <View style={[styles.skeletonBar, styles.subjectDateSkeleton]} />
        </View>
      </View>
    </View>
  );
};

export default DatesheetCardSkeleton;

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
    height: hp(1.3),
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
  descriptionSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  descriptionLabelSkeleton: {
    height: hp(1.3),
    width: '35%',
    marginBottom: 8,
  },
  descriptionTextSkeleton: {
    height: hp(1.4),
    width: '100%',
    marginBottom: 4,
  },
  expireDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expireDateLabelSkeleton: {
    height: hp(1.3),
    width: '30%',
    marginRight: 8,
  },
  expireDateValueSkeleton: {
    height: hp(1.3),
    width: '40%',
  },
  subjectsSection: {
    marginTop: 8,
  },
  subjectsLabelSkeleton: {
    height: hp(1.3),
    width: '30%',
    marginBottom: 12,
  },
  subjectItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  subjectNameSkeleton: {
    height: hp(1.4),
    width: '50%',
    marginBottom: 8,
  },
  subjectDateSkeleton: {
    height: hp(1.3),
    width: '40%',
  },
});

