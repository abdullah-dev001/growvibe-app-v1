import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pen from '../assets/icons/Pen';
import Trash from '../assets/icons/Trash';
import { hp } from '../helpers/common';

const NoteCard = ({
  note_Title,
  note_Description,
  expire_Date,
  created_By,
  is_For_Entire_Branch,
  specific_Class,
  created_at,
  onEdit,
  onDelete,
  className = '',
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (expireDate) => {
    if (!expireDate) return false;
    const today = new Date();
    const expire = new Date(expireDate);
    return expire < today;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note_Title}"? This action cannot be undone.`,
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

  const expired = isExpired(expire_Date);
  const expireColor = expired ? '#EF4444' : '#10B981';
  const expireBgColor = expired ? '#FEF2F2' : '#ECFDF5';

  return (
    <View style={styles.card}>
      {/* Header with Note Title and Expiry Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>
            {note_Title}
          </Text>
          {expire_Date && (
            <View style={[styles.statusBadgeLeft, { backgroundColor: expireBgColor }]}>
              <Text style={[styles.statusText, { color: expireColor }]}>
                {expired ? 'Expired' : 'Active'}
              </Text>
            </View>
          )}
        </View>
        {expire_Date && (
          <View style={[styles.statusBadge, { backgroundColor: expireBgColor }]}>
            <Text style={[styles.statusText, { color: expireColor }]}>
              {expired ? 'Expired' : 'Active'}
            </Text>
          </View>
        )}
      </View>

      {/* Note Description */}
      <View style={styles.section}>
        <Text style={styles.descriptionLabel}>Description:</Text>
        <Text style={styles.description} numberOfLines={3}>
          {note_Description || 'No description provided'}
        </Text>
      </View>

      {/* Note Details */}
      <View style={styles.section}>
        {/* Target Audience */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target:</Text>
          <Text style={styles.detailValue}>
            {is_For_Entire_Branch
              ? 'Entire Branch'
              : specific_Class
              ? `Class: ${specific_Class}`
              : 'Not specified'}
          </Text>
        </View>

        {/* Created By */}
        {created_By && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created By:</Text>
            <Text style={styles.detailValue}>{created_By}</Text>
          </View>
        )}

        {/* Expire Date */}
        {expire_Date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires On:</Text>
            <Text style={[styles.detailValue, expired && styles.expiredText]}>
              {formatDate(expire_Date)}
            </Text>
          </View>
        )}
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
      </View>
    </View>
  );
};

export default NoteCard;

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
  title: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: hp(0.3),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeLeft: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Medium',
  },
  section: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(0.5),
  },
  description: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    lineHeight: hp(2),
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(0.3),
  },
  detailValue: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
  },
  expiredText: {
    color: '#EF4444',
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
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  dateValue: {
    fontSize: hp(1.4),
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
});
