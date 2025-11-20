import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { hp } from '../helpers/common';
import { useGetLatestNotesByBranchAndClassQuery } from '../redux/api/noteApi';

const ImportantNotes = ({ renderEmptyState }) => {
  const { branchId, classId } = useSelector((state) => state.auth);

  const { data: notes, isFetching, error } = useGetLatestNotesByBranchAndClassQuery(
    { branchId, classId: classId || null, limit: 3 },
    { skip: !branchId || !classId }
  );

  if (!branchId || !classId) {
    return null;
  }

  if (isFetching) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  if (error || !notes || notes.length === 0) {
    if (renderEmptyState) {
      return renderEmptyState();
    }
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {notes.map((note, index) => (
        <ImportantNoteCard
          key={note.id || index}
          note_Title={note.note_Title}
          note_Description={note.note_Description}
          created_by_role={note.created_by_role}
          is_For_Entire_Branch={note.is_For_Entire_Branch}
          created_at={note.created_at}
        />
      ))}
    </View>
  );
};

// Individual note card component
const ImportantNoteCard = ({
  note_Title,
  note_Description,
  created_by_role,
  is_For_Entire_Branch,
  created_at,
}) => {
  const getStatusBadgeText = () => {
    return is_For_Entire_Branch ? 'Entire Branch' : 'Specific Class';
  };

  const statusBadgeStyle = is_For_Entire_Branch 
    ? { backgroundColor: '#EFF6FF', color: '#1CACF3' } 
    : { backgroundColor: '#F3E8FF', color: '#8B5CF6' };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Status Badge */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {note_Title || 'Untitled Note'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusBadgeStyle.color }]}>
            {getStatusBadgeText()}
          </Text>
        </View>
      </View>

      {/* Description */}
      {note_Description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {note_Description}
          </Text>
        </View>
      )}

      {/* Footer with Role and Date */}
      <View style={styles.footer}>
        {created_by_role && (
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Created By:</Text>
            <Text style={styles.roleValue}>{created_by_role}</Text>
          </View>
        )}
        {created_at && (
          <Text style={styles.dateText}>{formatDate(created_at)}</Text>
        )}
      </View>
    </View>
  );
};

export default ImportantNotes;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: hp(1.7),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    lineHeight: hp(2.2),
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  description: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: hp(2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#9CA3AF',
    marginRight: 6,
  },
  roleValue: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
});