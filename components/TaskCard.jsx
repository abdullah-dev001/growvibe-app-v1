import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hp } from '../helpers/common';

const TaskCard = ({
  todo_Title,
  todo_Description,
  todo_Priority = 'medium',
  expire_Date,
  created_By,
  onPress,
  className = '',
}) => {
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FEF2F2'; // Light red
      case 'medium':
        return '#FFFBEB'; // Light amber
      case 'low':
        return '#ECFDF5'; // Light green
      default:
        return '#F9FAFB'; // Light gray
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const priorityColor = getPriorityColor(todo_Priority);
  const priorityBgColor = getPriorityBgColor(todo_Priority);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.7}
    >
      {/* Header with Title and Priority */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>
            {todo_Title}
          </Text>
        </View>
        
        {/* Priority Badge */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityBgColor }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {todo_Priority}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description} numberOfLines={3}>
          {todo_Description}
        </Text>
      </View>

      {/* Footer with Date and Creator */}
      <View style={styles.footer}>
        {/* Expire Date */}
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Due:</Text>
          <Text style={styles.footerValue}>
            {formatDate(expire_Date)}
          </Text>
        </View>

        {/* Created By */}
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>By:</Text>
          <Text style={[styles.footerValue, styles.footerValueMargin]} numberOfLines={1}>
            {created_By}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TaskCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: hp(2.4),
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  priorityText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  description: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: hp(2.2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  footerValue: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#374151',
  },
  footerValueMargin: {
    marginLeft: hp(0.5),
  },
});