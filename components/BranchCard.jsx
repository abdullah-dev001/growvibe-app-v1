import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pen from '../assets/icons/Pen';
import Trash from '../assets/icons/Trash';
import { hp } from '../helpers/common';

const BranchCard = ({
  branch_Name,
  branch_Address,
  branch_Contact,
  branch_Status = true,
  branch_Subscription_Fee,
  created_at,
  onEdit,
  onDelete,
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

  const statusColor = getStatusColor(branch_Status);
  const statusBgColor = getStatusBgColor(branch_Status);

  const handleDelete = () => {
    Alert.alert(
      'Delete Branch',
      `Are you sure you want to delete "${branch_Name}"? This action cannot be undone.`,
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
      {/* Header with Branch Name and Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.branchName} numberOfLines={2}>
            {branch_Name}
          </Text>
          <Text style={styles.branchAddress} numberOfLines={1}>
            {branch_Address}
          </Text>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {branch_Status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Branch Details */}
      <View style={styles.section}>
        {/* Contact */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact:</Text>
          <Text style={styles.detailValue}>{branch_Contact}</Text>
        </View>

        {/* Subscription Fee */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Subscription Fee:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {branch_Subscription_Fee}
          </Text>
        </View>
      </View>

      {/* Created Date */}
      <View style={styles.dateRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Created:</Text>
          <Text style={styles.dateValue}>
            {formatDate(created_at)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
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
    </View>
  );
};

export default BranchCard;

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
  branchName: {
    fontSize: hp(2.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: hp(2.6),
  },
  branchAddress: {
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  dateValue: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    marginLeft: hp(0.5),
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
});