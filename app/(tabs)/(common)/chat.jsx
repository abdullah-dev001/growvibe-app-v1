import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Attachment from '../../../assets/icons/Attachment';
import ImageIcon from '../../../assets/icons/Image';
import Microphone from '../../../assets/icons/Microphone';
import { hp } from '../../../helpers/common';
import { useGetUserGroupChatsQuery, useLazyGetUserGroupChatsQuery } from '../../../redux/api/chatApi';
import { supabase } from '../../../supabaseClient';

const chat = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [groupsList, setGroupsList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const groupImageCacheRef = useRef({}); // Cache for group image signed URLs

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetUserGroupChatsQuery(
    undefined,
    { skip: !user?.id }
  );

  const [trigger, { isFetching }] = useLazyGetUserGroupChatsQuery();

  // Sync local state with API data
  useEffect(() => {
    if (initialData !== undefined) {
      setGroupsList(initialData || []);
    }
  }, [initialData]);

  // Refetch when screen comes into focus (e.g., when returning from chat detail)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refetch();
      }
    }, [user?.id, refetch])
  );

  const handleRefresh = async () => {
    if (isRefreshing || !user?.id) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to format last message and return icon and text
  const formatLastMessage = (message) => {
    if (!message) return { icon: null, text: 'No messages yet' };
    
    // Check if message is a URL
    const isUrl = message.startsWith('http://') || message.startsWith('https://');
    
    if (isUrl) {
      // Check if it's a voice note
      if (message.includes('voice') || message.includes('.m4a') || message.includes('group-voice')) {
        return { icon: 'microphone', text: 'Voice note' };
      }
      
      // Check if it's an image
      if (message.includes('image') || 
          message.includes('.jpg') || 
          message.includes('.jpeg') || 
          message.includes('.png') || 
          message.includes('.gif') ||
          message.includes('group-attachments')) {
        return { icon: 'image', text: 'Image' };
      }
      
      // Check if it's an attachment
      if (message.includes('attachment') || message.includes('group-attachments')) {
        return { icon: 'attachment', text: 'Attachment' };
      }
      
      // Default for any other URL
      return { icon: 'attachment', text: 'Attachment' };
    }
    
    // Try to parse as JSON (for attachment messages)
    try {
      const parsed = JSON.parse(message);
      if (parsed.type) {
        if (parsed.type.startsWith('image/')) {
          return { icon: 'image', text: 'Image' };
        }
        if (parsed.type.startsWith('audio/') || parsed.type.includes('voice')) {
          return { icon: 'microphone', text: 'Voice note' };
        }
        return { icon: 'attachment', text: 'Attachment' };
      }
    } catch (e) {
      // Not JSON, continue with normal message
    }
    
    return { icon: null, text: message };
  };

  // Helper function to get group image signed URL
  const getGroupImageSignedUrl = async (groupImage) => {
    if (!groupImage) return null;
    
    // Check cache first
    if (groupImageCacheRef.current[groupImage]) {
      return groupImageCacheRef.current[groupImage];
    }

    const extractGroupImagePath = (url) => {
      if (!url) return null;
      try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return url;
        }
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        // Handle Supabase storage URLs
        const publicIndex = pathname.indexOf('/storage/v1/object/public/');
        const signIndex = pathname.indexOf('/storage/v1/object/sign/');
        
        if (publicIndex !== -1) {
          const afterPublic = pathname.substring(publicIndex + '/storage/v1/object/public/'.length);
          return afterPublic.split('?')[0] || null;
        }
        
        if (signIndex !== -1) {
          const afterSign = pathname.substring(signIndex + '/storage/v1/object/sign/'.length);
          return afterSign.split('?')[0] || null;
        }
        
        // Try to find group-attachments pattern
        const attachmentIndex = pathname.indexOf('group-attachments/');
        if (attachmentIndex !== -1) {
          const afterAttachment = pathname.substring(attachmentIndex + 'group-attachments/'.length);
          return afterAttachment.split('?')[0] || null;
        }
        
        return null;
      } catch (e) {
        return null;
      }
    };

    const filePath = extractGroupImagePath(groupImage);
    if (!filePath) {
      // If we can't extract path, use original URL (might already be a signed URL or public URL)
      groupImageCacheRef.current[groupImage] = groupImage;
      return groupImage;
    }

    // Extract bucket name from file path
    let bucketName = 'group-attachments';
    let actualFilePath = filePath;
    
    // Remove bucket name prefix if present
    if (filePath.startsWith('group-attachments/')) {
      actualFilePath = filePath.substring('group-attachments/'.length);
    } else if (!filePath.includes('/')) {
      // If path doesn't have bucket prefix, it might be the full path
      // Check if it starts with school/class pattern
      if (filePath.startsWith('school') && filePath.includes('class')) {
        // This is the full path, use as is
        actualFilePath = filePath;
      }
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(actualFilePath, 3600);

      if (!error && data?.signedUrl) {
        groupImageCacheRef.current[groupImage] = data.signedUrl;
        return data.signedUrl;
      } else {
        // Fallback to original URL
        groupImageCacheRef.current[groupImage] = groupImage;
        return groupImage;
      }
    } catch (e) {
      // Fallback to original URL
      groupImageCacheRef.current[groupImage] = groupImage;
      return groupImage;
    }
  };

  // Component to render group avatar with image or placeholder
  const GroupAvatar = ({ groupImage, groupName }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
      if (groupImage) {
        // Check cache first (synchronously)
        if (groupImageCacheRef.current[groupImage]) {
          setImageUrl(groupImageCacheRef.current[groupImage]);
        } else {
          // Fetch signed URL
          getGroupImageSignedUrl(groupImage).then((url) => {
            if (url) {
              setImageUrl(url);
            }
          });
        }
      } else {
        setImageUrl(null);
      }
    }, [groupImage]);

    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatar}
          cachePolicy="disk"
          contentFit="cover"
        />
      );
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {groupName.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderGroupItem = ({ item }) => {
    // Map view fields to component props
    const chatId = item.chat_id;
    const groupName = item.group_name || 'Group';
    // Try multiple possible field names for group image
    const groupImage = item.group_Image || item.group_image || item.groupImage || '';
    const lastMessage = item.last_message || '';
    const lastMessageTime = item.last_message_time || '';
    const unreadCount = item.unread_count || 0;
    const memberCount = item.group_member_count || 0;
    
    const formattedLastMessage = formatLastMessage(lastMessage);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/screens/chatDetail',
            params: {
              chatId: chatId,
              chatName: groupName,
              chatImage: groupImage || '',
              chatType: 'group',
              classId: item.class_Id || '',
              memberCount: memberCount,
            },
          });
        }}
      >
        {/* Group Image */}
        <View style={styles.avatarContainer}>
          <GroupAvatar groupImage={groupImage} groupName={groupName} />
        </View>

        {/* Group Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <Text style={styles.personName} numberOfLines={1}>
                {groupName}
              </Text>
              {/* {memberCount > 0 && (
                <Text style={styles.memberCount}>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </Text>
              )} */}
            </View>
            <Text style={styles.lastMessageTime}>
              {lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }) : ''}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <View style={styles.lastMessageContainer}>
              {formattedLastMessage.icon === 'microphone' && (
                <Microphone size={hp(1.4)} color="#6B7280" strokeWidth={2} style={styles.messageIcon} />
              )}
              {formattedLastMessage.icon === 'image' && (
                <ImageIcon size={hp(1.4)} color="#6B7280" strokeWidth={2} style={styles.messageIcon} />
              )}
              {formattedLastMessage.icon === 'attachment' && (
                <Attachment size={hp(1.4)} color="#6B7280" strokeWidth={2} style={styles.messageIcon} />
              )}
              <Text style={styles.lastMessage} numberOfLines={1}>
                {formattedLastMessage.text}
              </Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupChatList = () => {
    if (isFetchingInitial && groupsList.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1CACF3" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Groups</Text>
          <View style={styles.listDivider} />
        </View>
        <FlatList
          data={groupsList}
          keyExtractor={(item) => String(item.chat_id || item.id)}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.scrollContent}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#1CACF3']}
              tintColor="#1CACF3"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No groups yet. Create or join a group!
              </Text>
            </View>
          }
        />
      </>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSubtitle}>Group conversations</Text>
        </View>

        {/* Group Chat List */}
        {renderGroupChatList()}
      </View>
    </View>
  );
};

export default chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-SemiBold',
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
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
  },
  avatarPlaceholder: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#6B7280',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chatHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  personName: {
    fontSize: hp(1.7),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  memberCount: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  lastMessageTime: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  messageIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#1CACF3',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 12,
  },
});

