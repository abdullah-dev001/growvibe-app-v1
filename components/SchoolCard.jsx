import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pen from '../assets/icons/Pen';
import Trash from '../assets/icons/Trash';
import { hp } from '../helpers/common';

const SchoolCard = ({
  school_Name,
  school_Address,
  school_Contact,
  school_Status = true,
  school_Subscription_Fee,
  created_at,
  owner_Email,
  total_Users = 0,
  onEdit,
  onDelete,
  onEditOwner,
  onViewPayments,
  onViewBranches,
  className = '',
}) => {
  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444'; // Green for true (active), Red for false (inactive)
  };

  const getStatusBgColor = (status) => {
    return status ? '#ECFDF5' : '#FEF2F2'; // Light green for true (active), Light red for false (inactive)
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColor = getStatusColor(school_Status);
  const statusBgColor = getStatusBgColor(school_Status);

  const handleDelete = () => {
    Alert.alert(
      'Delete School',
      `Are you sure you want to delete "${school_Name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  

  return (
    <View style={styles.card}>
      {/* Header with School Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.schoolName} numberOfLines={2}>
            {school_Name}
          </Text>
          <Text style={styles.schoolAddress} numberOfLines={1}>
            {school_Address}
          </Text>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {school_Status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* School Details */}
      <View style={styles.section}>
        {/* Contact */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact:</Text>
          <Text style={styles.detailValue}>{school_Contact}</Text>
        </View>

        {/* Owner Email */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Owner Email:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {owner_Email}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Subscription Fee:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {school_Subscription_Fee}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Users:</Text>
          <Text style={styles.statValue}>{total_Users}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Created:</Text>
          <Text style={styles.statValueDate}>
            {formatDate(created_at)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
            activeOpacity={0.7}
          >
            <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <Trash size={hp(1.6)} color="#EF4444" strokeWidth={2} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Action Buttons */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            onPress={onEditOwner}
            style={styles.secondaryButton}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonTextBlue}>Edit Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onViewPayments}
            style={[styles.secondaryButton, styles.secondaryButtonGreen]}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonTextGreen}>View Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onViewBranches}
            style={[styles.secondaryButton, styles.secondaryButtonPurple]}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonTextPurple}>View Branches</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SchoolCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  schoolName: {
    fontSize: hp(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: hp(2.6),
  },
  schoolAddress: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: hp(2.2),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  statValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#1CACF3',
    marginLeft: hp(0.5),
  },
  statValueDate: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    marginLeft: hp(0.5),
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  primaryActions: {
    flexDirection: 'row',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
    marginLeft: hp(0.5),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
    marginLeft: hp(0.5),
  },
  secondaryActions: {
    flexDirection: 'row',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  secondaryButtonGreen: {
    backgroundColor: '#D1FAE5',
    marginLeft: 8,
  },
  secondaryButtonPurple: {
    backgroundColor: '#F3E8FF',
    marginLeft: 8,
  },
  secondaryButtonTextBlue: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  secondaryButtonTextGreen: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
  },
  secondaryButtonTextPurple: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#8B5CF6',
  },
});