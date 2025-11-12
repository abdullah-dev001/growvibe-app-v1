import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../../assets/icons/Plus';
import Button from '../../../components/Button';
import SearchBar from '../../../components/SearchBar';
import TicketCardSkeleton from '../../../components/skeletons/TicketCardSkeleton';
import { hp } from '../../../helpers/common';
import { useCreateTicketReplyMutation, useGetTicketsQuery, useLazyGetTicketRepliesQuery, useUpdateTicketStatusMutation } from '../../../redux/api/ticketApi';

const support = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [repliesMap, setRepliesMap] = useState({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState({});
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReplyMap, setSubmittingReplyMap] = useState({});

  const { data: ticketsData, isLoading: isLoadingTickets, refetch: refetchTickets } = useGetTicketsQuery(
    { userId: user?.id, role: user?.role },
    { skip: !user?.id }
  );
  const [getTicketReplies] = useLazyGetTicketRepliesQuery();
  const [createTicketReply, { isLoading: isCreatingReply }] = useCreateTicketReplyMutation();
  const [updateTicketStatus, { isLoading: isUpdatingStatus }] = useUpdateTicketStatusMutation();

  const tickets = ticketsData || [];
  const isAdmin = user?.role === 'admin';

  const handleAddTicket = () => {
    router.push('/screens/forms/addTicket');
  };

  const handleViewReplies = async (ticketId) => {
    // Toggle expansion
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }

    setExpandedTicketId(ticketId);

    // If replies already loaded, don't fetch again
    if (repliesMap[ticketId]) {
      return;
    }

    // Fetch replies
    setLoadingRepliesMap((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const result = await getTicketReplies(ticketId).unwrap();
      setRepliesMap((prev) => ({ ...prev, [ticketId]: result || [] }));
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      Alert.alert('Error', 'Failed to load ticket replies');
      setRepliesMap((prev) => ({ ...prev, [ticketId]: [] }));
    } finally {
      setLoadingRepliesMap((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleSubmitReply = async (ticketId) => {
    const replyText = replyTextMap[ticketId]?.trim();
    if (!replyText) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    setSubmittingReplyMap((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await createTicketReply({
        ticket_Id: ticketId,
        reply: replyText,
        created_By: user?.id,
      }).unwrap();

      // Clear reply text
      setReplyTextMap((prev) => ({ ...prev, [ticketId]: '' }));

      // Refresh replies
      const result = await getTicketReplies(ticketId).unwrap();
      setRepliesMap((prev) => ({ ...prev, [ticketId]: result || [] }));

      // Tickets will be automatically refetched due to invalidatesTags in the mutation
      // No need to manually call refetchTickets()

      Alert.alert('Success', 'Reply added successfully');
    } catch (error) {
      console.error('Failed to create reply:', error);
      Alert.alert('Error', error?.data?.message || 'Failed to add reply');
    } finally {
      setSubmittingReplyMap((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleCloseTicket = async (ticketId) => {
    Alert.alert(
      'Close Ticket',
      'Are you sure you want to close this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateTicketStatus({
                ticketId,
                status: false,
              }).unwrap();
              Alert.alert('Success', 'Ticket closed successfully');
            } catch (error) {
              console.error('Failed to close ticket:', error);
              Alert.alert('Error', error?.data?.message || 'Failed to close ticket');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#FEE2E2';
      case 'medium':
        return '#FEF3C7';
      case 'low':
        return '#D1FAE5';
      default:
        return '#F3F4F6';
    }
  };

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
  };

  const getStatusBgColor = (status) => {
    return status ? '#D1FAE5' : '#FEE2E2';
  };

  const renderTicketCard = ({ item: ticket }) => {
    const priorityColor = getPriorityColor(ticket.ticket_Priority);
    const priorityBgColor = getPriorityBgColor(ticket.ticket_Priority);
    const statusColor = getStatusColor(ticket.ticket_Status);
    const statusBgColor = getStatusBgColor(ticket.ticket_Status);
    const isExpanded = expandedTicketId === ticket.id;
    const replies = repliesMap[ticket.id] || [];
    const isLoadingReplies = loadingRepliesMap[ticket.id];

    return (
      <View style={styles.card}>
        {/* Header with Title and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {ticket.ticket_Title || 'Untitled Ticket'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {ticket.ticket_Status ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Priority Badge */}
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityBgColor }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {ticket.ticket_Priority || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {ticket.ticket_Description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={isExpanded ? undefined : 3}>
              {ticket.ticket_Description}
            </Text>
          </View>
        )}

        {/* Creator Info */}
        <View style={styles.creatorContainer}>
          <View style={styles.creatorInfo}>
            {ticket.created_by_image || ticket.created_By_image ? (
              <Image
                source={{ uri: ticket.created_by_image || ticket.created_By_image }}
                style={styles.creatorAvatar}
                onError={() => {}}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorAvatarText}>
                  {(ticket.created_by_name || ticket.created_By_name)?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>
                {ticket.created_by_name || ticket.created_By_name || 'Unknown User'}
              </Text>
              {(ticket.created_by_email || ticket.created_By_email) && (
                <Text style={styles.creatorEmail}>
                  {ticket.created_by_email || ticket.created_By_email}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer with Date and Reply Count */}
        <View style={styles.footer}>
          <Text style={styles.dateText}>{formatDate(ticket.created_at)}</Text>
          <Text style={styles.replyCountText}>
            {ticket.reply_count || 0} {ticket.reply_count === 1 ? 'reply' : 'replies'}
          </Text>
        </View>

        {/* Add Reply Form - Always Visible */}
        <View style={styles.addReplySection}>
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply here..."
              placeholderTextColor="#9CA3AF"
              value={replyTextMap[ticket.id] || ''}
              onChangeText={(text) => {
                setReplyTextMap((prev) => ({ ...prev, [ticket.id]: text }));
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            onPress={() => handleSubmitReply(ticket.id)}
            style={[
              styles.submitReplyButton,
              (submittingReplyMap[ticket.id] || isCreatingReply) && styles.submitReplyButtonDisabled,
            ]}
            disabled={submittingReplyMap[ticket.id] || isCreatingReply}
            activeOpacity={0.7}
          >
            <Text style={styles.submitReplyButtonText}>
              {submittingReplyMap[ticket.id] || isCreatingReply ? 'Submitting...' : 'Submit Reply'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleViewReplies(ticket.id)}
            style={styles.viewRepliesButton}
            activeOpacity={0.7}
          >
            <Text style={styles.viewRepliesButtonText}>
              {isExpanded ? 'Hide Replies' : 'View Replies'}
            </Text>
          </TouchableOpacity>
          {isAdmin && ticket.ticket_Status && (
            <TouchableOpacity
              onPress={() => handleCloseTicket(ticket.id)}
              style={[styles.closeTicketButton, { marginLeft: 8 }]}
              activeOpacity={0.7}
              disabled={isUpdatingStatus}
            >
              <Text style={styles.closeTicketButtonText}>
                {isUpdatingStatus ? 'Closing...' : 'Close Ticket'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expanded Replies Section */}
        {isExpanded && (
          <View style={styles.repliesSection}>
            {isLoadingReplies ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading replies...</Text>
              </View>
            ) : (
              <>
                {replies.length === 0 ? (
                  <View style={styles.emptyRepliesContainer}>
                    <Text style={styles.emptyRepliesText}>No replies yet for this ticket.</Text>
                  </View>
                ) : (
                  <View style={styles.repliesList}>
                    {replies.map((reply, index) => (
                      <View key={reply.id || index} style={styles.replyCard}>
                        <View style={styles.replyHeader}>
                          <View style={styles.replyCreatorInfo}>
                            {reply.replied_By_image || reply.replied_by_image ? (
                              <Image
                                source={{ uri: reply.replied_By_image || reply.replied_by_image }}
                                style={styles.replyAvatar}
                                onError={() => {}}
                              />
                            ) : (
                              <View style={styles.replyAvatarPlaceholder}>
                                <Text style={styles.replyAvatarText}>
                                  {(reply.replied_By_name || reply.replied_by_name)?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                              </View>
                            )}
                            <View style={styles.replyCreatorDetails}>
                              <Text style={styles.replyCreatorName}>
                                {reply.replied_By_name || reply.replied_by_name || 'Unknown User'}
                              </Text>
                              {(reply.replied_By_email || reply.replied_by_email) && (
                                <Text style={styles.replyCreatorEmail}>
                                  {reply.replied_By_email || reply.replied_by_email}
                                </Text>
                              )}
                            </View>
                          </View>
                          <Text style={styles.replyDate}>{formatDate(reply.created_at)}</Text>
                        </View>
                        <Text style={styles.replyText}>{reply.reply || 'No reply text'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Support Tickets</Text>
            <Text style={styles.subTitle}>Manage and track support tickets</Text>
          </View>
          {!isAdmin && (
            <Button
              title="Add Ticket"
              onPress={handleAddTicket}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#1CACF3"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Tickets List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Tickets List</Text>
          <View style={styles.listDivider} />
        </View>

        {/* Tickets List */}
        <FlatList
          data={tickets}
          keyExtractor={(ticket) => String(ticket.id)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.scrollContent}
          refreshing={isLoadingTickets}
          onRefresh={refetchTickets}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoadingTickets ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TicketCardSkeleton key={index} />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No tickets found. {!isAdmin && 'Create your first ticket to get started.'}
                </Text>
                {!isAdmin && (
                  <Button
                    title="Add Ticket"
                    onPress={handleAddTicket}
                    size="small"
                    bgColor="#1CACF3"
                    textColor="#FFFFFF"
                    icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                  />
                )}
              </View>
            )
          }
          removeClippedSubviews
          initialNumToRender={5}
          windowSize={10}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default support;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  listTitle: {
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  listDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 56,
  },
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Medium',
  },
  priorityContainer: {
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
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
    marginBottom: 12,
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  replyCountText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: hp(1),
    justifyContent: 'flex-end',
  },
  viewRepliesButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  viewRepliesButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  closeTicketButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  closeTicketButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  creatorContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  creatorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#6B7280',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  creatorEmail: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  repliesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  repliesList: {
    // Gap handled by marginBottom in replyCard
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  emptyRepliesContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyRepliesText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  replyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  replyCreatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  replyAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#6B7280',
  },
  replyCreatorDetails: {
    flex: 1,
  },
  replyCreatorName: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  replyCreatorEmail: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  replyText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    lineHeight: hp(2),
    marginTop: 8,
  },
  replyDate: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  addReplySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  replyInputContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  replyInput: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: hp(8),
    maxHeight: hp(20),
  },
  submitReplyButton: {
    backgroundColor: '#1CACF3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReplyButtonDisabled: {
    opacity: 0.6,
  },
  submitReplyButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
});
