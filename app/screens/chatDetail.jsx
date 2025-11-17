import { decode } from 'base64-arraybuffer';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import AttachmentPreview from '../../components/chat/AttachmentPreview';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import MessageItem from '../../components/chat/MessageItem';
import RecordingControls from '../../components/chat/RecordingControls';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ScreenWrapper from '../../components/ScreenWrapper';
import MessageSkeleton from '../../components/skeletons/MessageSkeleton';
import { hp } from '../../helpers/common';
import { useLazyGetProfileByRoleQuery } from '../../redux/api/profileApi';
import { supabase } from '../../supabaseClient';

const chatDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSelector((state) => state.auth);
  const flatListRef = useRef(null);

  const chatId = params.chatId;
  const chatName = params.chatName || 'Chat';
  const chatImage = params.chatImage;
  const chatType = params.chatType || 'personal';
  const memberCount = params.memberCount ? parseInt(params.memberCount) : 0;

  const MESSAGE_PAGE_SIZE = 12;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: { name, image, timestamp } }
  const [attachment, setAttachment] = useState(null);
  const [attachmentData, setAttachmentData] = useState({}); // { messageId: { url, type, name } }
  const [downloadingAttachments, setDownloadingAttachments] = useState({});
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voicePlayers, setVoicePlayers] = useState({}); // { messageId: Audio.Sound }
  const [voiceData, setVoiceData] = useState({}); // { messageId: { url, duration, signedUrl } }
  const [voiceUrlCache, setVoiceUrlCache] = useState({}); // Cache for signed URLs to avoid hitting bucket
  const [voiceProgress, setVoiceProgress] = useState({}); // { messageId: { currentTime, duration, isPlaying } }
  const [attachmentUrlCache, setAttachmentUrlCache] = useState({}); // Cache for attachment signed URLs
  const [imagePreview, setImagePreview] = useState(null); // { url, name } for full-size preview
  const [groupImage, setGroupImage] = useState(chatImage);
  const [groupImageUrl, setGroupImageUrl] = useState(null); // Signed URL for group image in header
  const [pendingMessages, setPendingMessages] = useState({}); // { tempId: { content, type, timestamp } } for messages being sent
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const isChannelSubscribedRef = useRef(false);
  const recordingRef = useRef(null);
  const loadMoreTimeoutRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hasTriggeredLoadRef = useRef(false);
  const isPaginationInProgressRef = useRef(false);

  const { schoolId, branchId, classId } = useSelector((state) => state.auth);
  const currentUserId = user?.id;
  const userRole = user?.role;
  const classIdFromParams = params.classId;
  const [getProfileByRole] = useLazyGetProfileByRoleQuery();

  // Extract file path from Supabase storage URL for attachments
  const extractAttachmentFilePath = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      
      const bucketIndex = pathParts.findIndex(part => part === 'group-attachments');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      const pathname = urlObj.pathname;
      const attachmentIndex = pathname.indexOf('group-attachments/');
      if (attachmentIndex !== -1) {
        const afterAttachment = pathname.substring(attachmentIndex + 'group-attachments/'.length);
        const filePath = afterAttachment.split('?')[0];
        return filePath || null;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // Get signed URL for attachment (with caching)
  const getAttachmentSignedUrl = async (url) => {
    if (!url) return url;
    
    const filePath = extractAttachmentFilePath(url);
    if (!filePath) return url; // Return original URL if we can't extract path
    
    // Check cache first
    if (attachmentUrlCache[filePath]) {
      const cachedData = attachmentUrlCache[filePath];
      const now = Date.now();
      if (cachedData.expiresAt > now) {
        return cachedData.signedUrl;
      } else {
        // Cache expired, remove it
        setAttachmentUrlCache((prev) => {
          const updated = { ...prev };
          delete updated[filePath];
          return updated;
        });
      }
    }
    
    // Get signed URL from storage
    try {
      const { data, error } = await supabase.storage
        .from("group-attachments")
        .createSignedUrl(filePath, 3600);
      
      if (!error && data?.signedUrl) {
        const expiresAt = Date.now() + (3600 * 1000) - 60000; // 1 hour minus 1 minute
        setAttachmentUrlCache((prev) => ({
          ...prev,
          [filePath]: {
            signedUrl: data.signedUrl,
            expiresAt: expiresAt,
          },
        }));
        return data.signedUrl;
      }
    } catch (e) {
      console.log('Failed to create signed URL for attachment, using public URL');
    }
    
    return url; // Fallback to original URL
  };

  // Fetch group image from chat table
  useEffect(() => {
    if (!chatId || chatType !== 'group') return;

    const fetchGroupInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("chat")
          .select("group_Image, group_Name")
          .eq("id", chatId)
          .maybeSingle();

        if (!error && data) {
          if (data.group_Image) {
            setGroupImage(data.group_Image);
          }
          if (data.group_Name && data.group_Name !== chatName) {
            // Update chat name if different
          }
        }
      } catch (err) {
        console.error('Error fetching group info:', err);
      }
    };

    fetchGroupInfo();
  }, [chatId, chatType]);

  // Generate signed URL for group image in header
  useEffect(() => {
    const currentImage = groupImage || chatImage;
    if (!currentImage) {
      setGroupImageUrl(null);
      return;
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

    const getGroupImageSignedUrl = async () => {
      const filePath = extractGroupImagePath(currentImage);
      if (!filePath) {
        // If we can't extract path, use original URL (might already be a signed URL or public URL)
        setGroupImageUrl(currentImage);
        return;
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
          setGroupImageUrl(data.signedUrl);
        } else {
          // Fallback to original URL
          setGroupImageUrl(currentImage);
        }
      } catch (e) {
        // Fallback to original URL
        setGroupImageUrl(currentImage);
      }
    };

    getGroupImageSignedUrl();
  }, [groupImage, chatImage]);

  // Update last_Read when screen opens
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const updateLastRead = async () => {
      try {
        await supabase
          .from("chat_member")
          .update({ last_Read: new Date().toISOString() })
          .eq("chat_Id", chatId)
          .eq("user_Id", currentUserId);
      } catch (error) {
        // Error updating last read - don't block UI
      }
    };

    updateLastRead();
  }, [chatId, currentUserId]);

  // Fetch latest messages from message_with_sender view (paginated)
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setHasMoreMessages(true);
      try {
        // Fetch latest MESSAGE_PAGE_SIZE messages, ordered by created_at descending
        const { data: messagesData, error } = await supabase
          .from("message_with_sender")
          .select("*")
          .eq("chat_Id", chatId)
          .order("created_at", { ascending: false })
          .limit(MESSAGE_PAGE_SIZE);

        if (error) {
          // Error fetching messages
          setMessages([]);
        } else {
          // Reverse to show oldest first (for proper chat display)
          const reversedMessages = (messagesData || []).reverse();
          setMessages(reversedMessages);
          setHasMoreMessages((messagesData || []).length === MESSAGE_PAGE_SIZE);
          
          // Extract attachment data from messages and get signed URLs for images
          const attachmentMap = {};
          const attachmentPromises = messagesData?.map(async (msg) => {
            if ((msg.message_Type || msg.message_type) === 'attachment' && msg.content) {
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed.url) {
                  let displayUrl = parsed.url;
                  // Get signed URL for images to ensure they're visible
                  if (parsed.type?.startsWith('image/')) {
                    displayUrl = await getAttachmentSignedUrl(parsed.url);
                  }
                  attachmentMap[msg.id] = {
                    url: parsed.url, // Keep original URL
                    displayUrl: displayUrl, // Use signed URL for display
                    name: parsed.name || 'Attachment',
                    type: parsed.type || 'application/octet-stream',
                  };
                }
              } catch (e) {
                attachmentMap[msg.id] = {
                  url: null,
                  displayUrl: null,
                  name: msg.content || 'Attachment',
                  type: 'application/octet-stream',
                };
              }
            }
          }) || [];
          await Promise.all(attachmentPromises);
          setAttachmentData(attachmentMap);
          
          // Fetch voice data for voice messages from message table
          const voiceMessages = messagesData?.filter(
            (msg) => (msg.message_Type || msg.message_type) === 'voice'
          ) || [];
          
          if (voiceMessages.length > 0) {
            const voicePromises = voiceMessages.map(async (msg) => {
              try {
                // Check if voice URL is already in the message data
                const voiceUrl = msg.voice_Url || msg.content;
                if (voiceUrl) {
                  return {
                    messageId: msg.id,
                    url: voiceUrl,
                    duration: msg.duration,
                  };
                }
                
                // Fallback: fetch from message table
                const { data: voiceInfo, error: voiceError } = await supabase
                  .from("message")
                  .select("voice_Url, content, duration")
                  .eq("id", msg.id)
                  .maybeSingle();
                
                if (voiceError) {
                  console.error('Voice fetch error:', voiceError);
                  return null;
                }
                
                if (voiceInfo) {
                  return {
                    messageId: msg.id,
                    url: voiceInfo.voice_Url || voiceInfo.content,
                    duration: voiceInfo.duration,
                  };
                }
              } catch (e) {
                console.error('Error fetching voice data:', e);
              }
              return null;
            });
            
            const voices = await Promise.all(voicePromises);
            const voiceMap = {};
            voices.forEach((voice) => {
              if (voice) {
                voiceMap[voice.messageId] = voice;
              }
            });
            setVoiceData(voiceMap);
          }
          
          // Scroll to bottom after loading messages
          setTimeout(() => {
            if (flatListRef.current && reversedMessages && reversedMessages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }, 100);
        }
      } catch (err) {
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // Load more messages (older messages)
  const loadMoreMessages = async () => {
    // Prevent multiple simultaneous calls
    if (!chatId || isLoadingMore || isLoadingMoreRef.current || !hasMoreMessages || messages.length === 0) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      // Get the oldest message's created_at timestamp
      const oldestMessage = messages[0];
      const oldestTimestamp = oldestMessage?.created_at;
      
      if (!oldestTimestamp) {
        setHasMoreMessages(false);
        return;
      }

      // Store the first message ID to maintain scroll position
      const firstMessageId = oldestMessage.id;

      // Fetch older messages (before the oldest one)
      const { data: olderMessages, error } = await supabase
        .from("message_with_sender")
        .select("*")
        .eq("chat_Id", chatId)
        .lt("created_at", oldestTimestamp)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (error) {
        console.error('Error loading more messages:', error);
        return;
      }

      // Mark that pagination is in progress to prevent auto-scroll (even if no messages)
      isPaginationInProgressRef.current = true;
      
      if (olderMessages && olderMessages.length > 0) {
        // Reverse to show oldest first
        const reversedOlder = olderMessages.reverse();
        setMessages((prev) => [...reversedOlder, ...prev]);
        setHasMoreMessages(olderMessages.length === MESSAGE_PAGE_SIZE);
        
        // Extract attachment data from older messages and get signed URLs
        const olderAttachmentMap = {};
        const olderAttachmentPromises = olderMessages.map(async (msg) => {
          if ((msg.message_Type || msg.message_type) === 'attachment' && msg.content) {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.url) {
                let displayUrl = parsed.url;
                if (parsed.type?.startsWith('image/')) {
                  displayUrl = await getAttachmentSignedUrl(parsed.url);
                }
                olderAttachmentMap[msg.id] = {
                  url: parsed.url,
                  displayUrl: displayUrl,
                  name: parsed.name || 'Attachment',
                  type: parsed.type || 'application/octet-stream',
                };
              }
            } catch (e) {
              olderAttachmentMap[msg.id] = {
                url: null,
                displayUrl: null,
                name: msg.content || 'Attachment',
                type: 'application/octet-stream',
              };
            }
          }
        });
        await Promise.all(olderAttachmentPromises);
        setAttachmentData((prev) => ({ ...prev, ...olderAttachmentMap }));
        
        // Fetch voice data for new voice messages
        const voiceMessages = olderMessages.filter(
          (msg) => (msg.message_Type || msg.message_type) === 'voice'
        ) || [];
        
        if (voiceMessages.length > 0) {
          const voicePromises = voiceMessages.map(async (msg) => {
            try {
              const voiceUrl = msg.voice_Url || msg.content;
              if (voiceUrl) {
                return {
                  messageId: msg.id,
                  url: voiceUrl,
                  duration: msg.duration,
                };
              }
            } catch (e) {
              console.error('Error fetching voice data:', e);
            }
            return null;
          });
          
          const voices = await Promise.all(voicePromises);
          const voiceMap = {};
          voices.forEach((voice) => {
            if (voice) {
              voiceMap[voice.messageId] = voice;
            }
          });
          setVoiceData((prev) => ({ ...prev, ...voiceMap }));
        }

        // Maintain scroll position after prepending messages
        // Wait for layout, then scroll to the message that was first before
        setTimeout(() => {
          if (flatListRef.current) {
            // Find the index of the first message that was visible before loading
            const index = messages.findIndex((msg) => msg.id === firstMessageId);
            if (index >= 0) {
              // Scroll to maintain position (accounting for new messages prepended)
              try {
                flatListRef.current.scrollToIndex({
                  index: index + reversedOlder.length,
                  animated: false,
                  viewPosition: 0,
                });
              } catch (e) {
                // If scrollToIndex fails, use scrollToOffset as fallback
                // Calculate approximate offset based on message count
                // This is a fallback, so we'll just prevent auto-scroll to bottom
              }
            }
          }
        }, 100);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
      // Reset pagination flag after a delay to ensure scroll position is maintained
      setTimeout(() => {
        isPaginationInProgressRef.current = false;
      }, 500);
      // Reset trigger flag after loading completes (success or failure)
      setTimeout(() => {
        hasTriggeredLoadRef.current = false;
      }, 1000); // Wait 1 second before allowing another load
    }
  };

  // Handle scroll to load more messages (debounced)
  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset } = nativeEvent;
    const scrollPosition = contentOffset.y;
    
    // Reset trigger flag if user scrolls away from top
    if (scrollPosition > 200) {
      hasTriggeredLoadRef.current = false;
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
        loadMoreTimeoutRef.current = null;
      }
      return;
    }

    // Only check when scrolling near the top (within 100px) and haven't already triggered a load
    if (scrollPosition < 100 && 
        hasMoreMessages && 
        !isLoadingMore && 
        !isLoadingMoreRef.current && 
        !hasTriggeredLoadRef.current && 
        messages.length > 0) {
      
      // Clear any existing timeout
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }

      // Mark as triggered to prevent multiple calls
      hasTriggeredLoadRef.current = true;
      
      // Debounce: wait 500ms after scrolling stops before loading
      loadMoreTimeoutRef.current = setTimeout(() => {
        // Double-check conditions before loading
        if (hasMoreMessages && !isLoadingMore && !isLoadingMoreRef.current && messages.length > 0) {
          loadMoreMessages();
        }
        loadMoreTimeoutRef.current = null;
      }, 500);
    }
  };

  // Subscribe to realtime updates for new messages and typing events
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const channelName = `chat-${chatId}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
        },
        async (payload) => {
          // Fetch the full message with sender info from the view
          const { data, error } = await supabase
            .from("message_with_sender")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            setMessages((prev) => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some((msg) => msg.id === data.id);
              if (exists) {
                return prev;
              }
              // Remove any pending messages with the same content from the same sender
              const filtered = prev.filter((msg) => {
                if (msg.isPending && msg.sender_Id === currentUserId && msg.content === data.content) {
                  // Remove from pending messages
                  setPendingMessages((prevPending) => {
                    const updated = { ...prevPending };
                    delete updated[msg.id];
                    return updated;
                  });
                  return false;
                }
                return true;
              });
              return [...filtered, data];
            });
            
            // If it's an attachment message, extract attachment data
            if ((data.message_Type || data.message_type) === 'attachment' && data.content) {
              (async () => {
                try {
                  const parsed = JSON.parse(data.content);
                  if (parsed.url) {
                    let displayUrl = parsed.url;
                    // Get signed URL for images
                    if (parsed.type?.startsWith('image/')) {
                      displayUrl = await getAttachmentSignedUrl(parsed.url);
                    }
                    setAttachmentData((prev) => ({
                      ...prev,
                      [data.id]: {
                        url: parsed.url,
                        displayUrl: displayUrl,
                        name: parsed.name || 'Attachment',
                        type: parsed.type || 'application/octet-stream',
                      },
                    }));
                  }
                } catch (e) {
                  setAttachmentData((prev) => ({
                    ...prev,
                    [data.id]: {
                      url: null,
                      displayUrl: null,
                      name: data.content || 'Attachment',
                      type: 'application/octet-stream',
                    },
                  }));
                }
              })();
            }
            
            // If it's a voice message, fetch voice data from message table
            if ((data.message_Type || data.message_type) === 'voice') {
              (async () => {
                try {
                  // Check if voice URL is already in the message data
                  if (data.voice_Url || data.content) {
                    setVoiceData((prev) => ({
                      ...prev,
                      [data.id]: {
                        url: data.voice_Url || data.content,
                        duration: data.duration,
                      },
                    }));
                    return;
                  }
                  
                  // Fallback: fetch from message table
                  const { data: voiceInfo, error: voiceError } = await supabase
                    .from("message")
                    .select("voice_Url, content, duration")
                    .eq("id", data.id)
                    .maybeSingle();
                  
                  if (!voiceError && voiceInfo) {
                    setVoiceData((prev) => ({
                      ...prev,
                      [data.id]: {
                        url: voiceInfo.voice_Url || voiceInfo.content,
                        duration: voiceInfo.duration,
                      },
                    }));
                  }
                } catch (e) {
                  console.error('Error fetching voice data for new message:', e);
                }
              })();
            }
            
            // Auto scroll to bottom when new message arrives
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }, 100);
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          // Supabase broadcast payload structure: payload.payload contains the data
          const eventData = payload.payload || payload;
          const { userId, userName, userImage, isTyping } = eventData;
          
          if (!userId) return;
          
          // Don't show typing indicator for current user
          if (userId === currentUserId) return;

          if (isTyping) {
            setTypingUsers((prev) => ({
              ...prev,
              [userId]: {
                name: userName || 'User',
                image: userImage,
                timestamp: Date.now(),
              },
            }));
            // Auto scroll when typing indicator appears
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }, 100);
          } else {
            setTypingUsers((prev) => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isChannelSubscribedRef.current = true;
        } else {
          isChannelSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Clean up typing users that haven't updated in 5 seconds
    const typingCleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          if (now - updated[userId].timestamp > 5000) {
            delete updated[userId];
          }
        });
        return updated;
      });
    }, 1000);

    // Cleanup: unsubscribe when component unmounts or chatId changes
    return () => {
      clearInterval(typingCleanupInterval);
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      isChannelSubscribedRef.current = false;
      
      // Send stop typing event before cleanup
      if (isTypingRef.current && channelRef.current && isChannelSubscribedRef.current) {
        // Get full name for cleanup (async, but we'll try to send anyway)
        const sendStopTyping = async () => {
          let userName = user?.email?.split('@')[0] || 'User';
          if (userRole && currentUserId) {
            try {
              const { data: profile } = await getProfileByRole({
                userId: currentUserId,
                role: userRole,
              });
              if (profile?.full_Name) {
                userName = profile.full_Name;
              }
            } catch (e) {
              // Fallback to email
            }
          }
          
          try {
            channelRef.current?.send({
              type: "broadcast",
              event: "typing",
              payload: {
                userId: currentUserId,
                userName: userName,
                userImage: null,
                isTyping: false,
              },
            });
          } catch (e) {
            // Ignore errors during cleanup
          }
        };
        sendStopTyping();
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, currentUserId, user?.email]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !currentUserId || isSendingMessage) return;

    const messageContent = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX
    setIsSendingMessage(true);

    // Create a temporary message ID for the pending message
    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      id: tempId,
      chat_Id: chatId,
      sender_Id: currentUserId,
      sender_name: user?.email?.split('@')[0] || 'You',
      sender_image: null,
      message_Type: "text",
      message_type: "text",
      content: messageContent,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      isPending: true,
    };

    // Add pending message to the list immediately
    setMessages((prev) => [...prev, tempMessage]);
    setPendingMessages((prev) => ({
      ...prev,
      [tempId]: { content: messageContent, type: 'text', timestamp: new Date().toISOString() },
    }));

    // Scroll to bottom to show the pending message
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    try {
      const { data: insertedMessage, error } = await supabase
        .from("message")
        .insert({
          chat_Id: chatId,
          sender_Id: currentUserId,
          message_Type: "text",
          content: messageContent,
          duration: null,
        })
        .select()
        .single();

      if (error) {
        // If insert fails, remove pending message and restore the message text
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setPendingMessages((prev) => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
        setMessageText(messageContent);
        // You can add an Alert here to show error to user
      } else {
        // Stop typing indicator when message is sent
        if (isTypingRef.current) {
          isTypingRef.current = false;
          sendTypingEvent(false);
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Update last_Read to the message's created_at (or slightly after) to mark own message as read
        // This ensures last_Read is always >= message created_at
        const messageCreatedAt = insertedMessage?.created_at || new Date().toISOString();
        // Add 1 second to ensure last_Read is definitely after the message timestamp
        const lastReadTime = new Date(new Date(messageCreatedAt).getTime() + 1000).toISOString();
        
        await supabase
          .from("chat_member")
          .update({ last_Read: lastReadTime })
          .eq("chat_Id", chatId)
          .eq("user_Id", currentUserId);

        // Remove pending message when real message arrives (will be handled by realtime subscription)
        // But also remove it here as a fallback
        setPendingMessages((prev) => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      }
      // The realtime subscription will automatically add the message to the list and remove the pending one
    } catch (err) {
      // If insert fails, remove pending message and restore the message text
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setPendingMessages((prev) => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
      setMessageText(messageContent);
      // You can add an Alert here to show error to user
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;

      // Check file size (5MB limit)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      const uriParts = asset.uri.split('.');
      const fileExt = uriParts.length > 1 ? `.${uriParts[uriParts.length - 1]}` : '.jpg';
      setAttachment({
        uri: asset.uri,
        name: `image-${Date.now()}${fileExt}`,
        size: asset.fileSize || 0,
        type: asset.mimeType || 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to pick image');
    }
  };

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];
      if (!file) return;

      // Check file size (5MB limit)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      setAttachment({
        uri: file.uri,
        name: file.name || `document-${Date.now()}.pdf`,
        size: file.size || 0,
        type: file.mimeType || 'application/pdf',
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to pick document');
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      'Select Attachment Type',
      'Choose the type of file you want to attach',
      [
        {
          text: 'Image',
          onPress: handlePickImage,
        },
        {
          text: 'PDF/Document',
          onPress: handlePickPDF,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Upload attachment file to Supabase storage
  const uploadAttachmentFile = async (attachmentData) => {
    if (!attachmentData) return null;
    const finalClassId = classIdFromParams || classId;
    if (!schoolId || !finalClassId) {
      Alert.alert('Error', 'SchoolId and ClassId are required to upload attachments');
      return null;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(attachmentData.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Selected file no longer exists');
        return null;
      }

      if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return null;
      }

      const base64 = await FileSystem.readAsStringAsync(attachmentData.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        Alert.alert('Error', 'Failed to read file content');
        return null;
      }

      const arrayBuffer = decode(base64);
      const fileExt = attachmentData.name.includes('.')
        ? attachmentData.name.substring(attachmentData.name.lastIndexOf('.'))
        : '.bin';
      const filePath = `school${schoolId}/class${finalClassId}/attachment-${Date.now()}${fileExt}`;

      const { data, error } = await supabase.storage
        .from("group-attachments")
        .upload(filePath, arrayBuffer, {
          contentType: attachmentData.type || 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        Alert.alert('Upload Failed', `Could not upload attachment: ${error.message}`);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("group-attachments")
        .getPublicUrl(filePath);

      return {
        url: publicData?.publicUrl || null,
        path: filePath,
        name: attachmentData.name,
        type: attachmentData.type,
      };
    } catch (err) {
      Alert.alert('Error', 'Failed to upload attachment');
      return null;
    }
  };

  // Send attachment message
  const handleSendAttachment = async () => {
    if (!attachment || !chatId || !currentUserId || isSendingMessage || isUploading) return;

    setIsUploading(true);
    const attachmentToSend = attachment;
    setAttachment(null);

    try {
      const attachmentData = await uploadAttachmentFile(attachmentToSend);
      if (!attachmentData || !attachmentData.url) {
        setAttachment(attachmentToSend);
        setIsUploading(false);
        return;
      }

      // Store attachment URL in content field, and metadata in a JSON format
      const attachmentContent = JSON.stringify({
        url: attachmentData.url,
        name: attachmentData.name,
        type: attachmentData.type,
        path: attachmentData.path,
      });

      const { data: insertedMessage, error: messageError } = await supabase
        .from("message")
        .insert({
          chat_Id: chatId,
          sender_Id: currentUserId,
          message_Type: "attachment",
          content: attachmentContent, // Store full attachment data as JSON
          duration: null,
        })
        .select()
        .single();

      if (messageError) {
        Alert.alert('Error', 'Failed to send attachment');
        setAttachment(attachmentToSend);
        setIsUploading(false);
        return;
      }

      const messageCreatedAt = insertedMessage?.created_at || new Date().toISOString();
      const lastReadTime = new Date(new Date(messageCreatedAt).getTime() + 1000).toISOString();
      
      await supabase
        .from("chat_member")
        .update({ last_Read: lastReadTime })
        .eq("chat_Id", chatId)
        .eq("user_Id", currentUserId);

      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingEvent(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send attachment');
      setAttachment(attachmentToSend);
    } finally {
      setIsUploading(false);
    }
  };

  // Upload voice file to Supabase storage
  const uploadVoiceFile = async (voiceUri, durationSeconds) => {
    const finalClassId = classIdFromParams || classId;
    if (!schoolId || !finalClassId) {
      Alert.alert('Error', 'SchoolId and ClassId are required to upload voice messages');
      return null;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(voiceUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Voice file no longer exists');
        return null;
      }

      if (fileInfo.size && fileInfo.size > 500 * 1024) {
        Alert.alert('Error', 'Voice message is too large. Maximum size is 500KB (1 minute)');
        return null;
      }

      const base64 = await FileSystem.readAsStringAsync(voiceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        Alert.alert('Error', 'Failed to read voice file');
        return null;
      }

      const arrayBuffer = decode(base64);
      const filePath = `school${schoolId}/class${finalClassId}/voice-${Date.now()}.m4a`;

      const { data, error } = await supabase.storage
        .from("group-voice")
        .upload(filePath, arrayBuffer, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (error) {
        Alert.alert('Upload Failed', `Could not upload voice: ${error.message}`);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("group-voice")
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        Alert.alert('Error', 'Failed to get public URL for voice file');
        return null;
      }

      return {
        url: publicData.publicUrl,
        path: filePath,
        duration: durationSeconds,
      };
    } catch (err) {
      Alert.alert('Error', `Failed to upload voice message: ${err.message}`);
      return null;
    }
  };

  // Send voice message
  const handleSendVoiceMessage = async (voiceUri, durationSeconds) => {
    if (!chatId || !currentUserId || isSendingMessage || isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      const voiceData = await uploadVoiceFile(voiceUri, durationSeconds);
      if (!voiceData || !voiceData.url) {
        setIsUploading(false);
        return;
      }

      const { data: insertedMessage, error: messageError } = await supabase
        .from("message")
        .insert({
          chat_Id: chatId,
          sender_Id: currentUserId,
          message_Type: "voice",
          content: voiceData.url, // Store voice URL in content field
          duration: `${voiceData.duration}`,
        })
        .select()
        .single();

      if (messageError) {
        Alert.alert('Error', 'Failed to send voice message');
        setIsUploading(false);
        return;
      }

      const messageCreatedAt = insertedMessage?.created_at || new Date().toISOString();
      const lastReadTime = new Date(new Date(messageCreatedAt).getTime() + 1000).toISOString();
      
      await supabase
        .from("chat_member")
        .update({ last_Read: lastReadTime })
        .eq("chat_Id", chatId)
        .eq("user_Id", currentUserId);

      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingEvent(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      // Request microphone permissions using expo-av Audio module
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permissions to record voice messages');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording instance using expo-av
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Recording status updates
        }
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      Alert.alert('Error', `Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) {
      Alert.alert('Error', 'No recording in progress');
      return;
    }

    try {
      setIsRecording(false);
      
      // Stop and get the URI
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (!uri) {
        Alert.alert('Error', 'Failed to get recording URI');
        setRecordingDuration(0);
        recordingRef.current = null;
        return;
      }

      // Get duration from recording status
      const status = await recordingRef.current.getStatusAsync();
      const durationInSeconds = status.durationMillis ? Math.floor(status.durationMillis / 1000) : recordingDuration;

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Voice file does not exist');
        setRecordingDuration(0);
        recordingRef.current = null;
        return;
      }

      if (fileInfo.size && fileInfo.size > 500 * 1024) {
        Alert.alert('Error', 'Voice message is too large. Maximum size is 500KB (1 minute)');
        setRecordingDuration(0);
        recordingRef.current = null;
        return;
      }

      await handleSendVoiceMessage(uri, durationInSeconds);

      setRecordingDuration(0);
      recordingRef.current = null;
    } catch (err) {
      Alert.alert('Error', `Failed to stop recording: ${err.message}`);
      setRecordingDuration(0);
      recordingRef.current = null;
    }
  };

  const handleCancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore errors
      }
    }
    setIsRecording(false);
    setRecordingDuration(0);
    recordingRef.current = null;
  };

  // Handle attachment download
  const handleDownloadAttachment = async (messageId, fileUrl, fileType, fileName) => {
    if (downloadingAttachments[messageId]) return;

    setDownloadingAttachments((prev) => ({ ...prev, [messageId]: true }));

    try {
      // Extract file path from URL
      const extractFilePath = (url) => {
        if (!url) return null;
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(part => part);
          const bucketIndex = pathParts.findIndex(part => part === 'group-attachments');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            return pathParts.slice(bucketIndex + 1).join('/');
          }
          return null;
        } catch (e) {
          return null;
        }
      };

      const filePath = extractFilePath(fileUrl);
      let downloadUrl = fileUrl;

      // If we can extract file path, try to get signed URL (for private buckets)
      if (filePath) {
        try {
          const { data, error } = await supabase.storage
            .from("group-attachments")
            .createSignedUrl(filePath, 3600);

          if (!error && data?.signedUrl) {
            downloadUrl = data.signedUrl;
          }
        } catch (e) {
          // If signed URL fails, try using the public URL
          console.log('Failed to create signed URL, using public URL');
        }
      }

      // Download file using FileSystem
      const fileUri = FileSystem.documentDirectory + (fileName || `attachment-${Date.now()}`);
      const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      } else {
        Alert.alert('Success', 'File downloaded successfully');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', `Failed to download attachment: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloadingAttachments((prev) => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (!chatId || !currentUserId || !channelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user started typing and wasn't typing before
    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingEvent(true);
    }

    // If user stopped typing, wait 3 seconds before sending stop event
    if (!isTyping && isTypingRef.current) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTypingEvent(false);
      }, 5000); // Increased from 3000ms to 5000ms (5 seconds)
    }
  };

  // Send typing event via broadcast
  const sendTypingEvent = async (isTyping) => {
    if (!channelRef.current || !currentUserId || !isChannelSubscribedRef.current) return;

    // Get full name from profile
    let userName = user?.email?.split('@')[0] || 'User';
    if (userRole && currentUserId) {
      try {
        const { data: profile } = await getProfileByRole({
          userId: currentUserId,
          role: userRole,
        });
        if (profile?.full_Name) {
          userName = profile.full_Name;
        }
      } catch (e) {
        // Fallback to email if profile fetch fails
      }
    }
    
    try {
      const status = await channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          userName: userName,
          userImage: null,
          isTyping: isTyping,
        },
      });
    } catch (error) {
      // Error sending typing event - non-critical
    }
  };


  // Handle voice playback using expo-av Audio.Sound
  const handlePlayVoice = async (messageId, voiceUrl) => {
    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Stop any currently playing voice
      if (playingVoiceId && playingVoiceId !== messageId) {
        const prevSound = voicePlayers[playingVoiceId];
        if (prevSound) {
          try {
            await prevSound.unloadAsync();
          } catch (e) {
            // Ignore errors when unloading
          }
        }
        setVoicePlayers((prev) => {
          const updated = { ...prev };
          delete updated[playingVoiceId];
          return updated;
        });
      }

      const existingSound = voicePlayers[messageId];
      
      if (existingSound && playingVoiceId === messageId) {
        // Pause/resume if already loaded
        try {
          const status = await existingSound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await existingSound.pauseAsync();
            setPlayingVoiceId(null);
            // Update progress to show paused state
            const currentTime = status.positionMillis / 1000;
            const duration = status.durationMillis ? status.durationMillis / 1000 : null;
            setVoiceProgress((prev) => ({
              ...prev,
              [messageId]: {
                currentTime,
                duration,
                isPlaying: false,
              },
            }));
          } else if (status.isLoaded) {
            await existingSound.playAsync();
            setPlayingVoiceId(messageId);
            // Update progress to show playing state
            const currentTime = status.positionMillis / 1000;
            const duration = status.durationMillis ? status.durationMillis / 1000 : null;
            setVoiceProgress((prev) => ({
              ...prev,
              [messageId]: {
                currentTime,
                duration,
                isPlaying: true,
              },
            }));
          }
        } catch (e) {
          // If sound is corrupted, create a new one
          try {
            await existingSound.unloadAsync();
          } catch (unloadErr) {
            // Ignore
          }
          setVoicePlayers((prev) => {
            const updated = { ...prev };
            delete updated[messageId];
            return updated;
          });
          // Fall through to create new sound
        }
      }

      // Create new sound if needed
      if (!existingSound || playingVoiceId !== messageId) {
        // Extract file path from URL
        const filePath = extractVoiceFilePath(voiceUrl);
        let playbackUrl = voiceUrl;

        // Check cache first to avoid hitting bucket multiple times
        if (filePath && voiceUrlCache[filePath]) {
          const cachedData = voiceUrlCache[filePath];
          // Check if cached URL is still valid (not expired - signed URLs expire after 1 hour)
          const now = Date.now();
          if (cachedData.expiresAt > now) {
            playbackUrl = cachedData.signedUrl;
          } else {
            // Cache expired, remove it
            setVoiceUrlCache((prev) => {
              const updated = { ...prev };
              delete updated[filePath];
              return updated;
            });
          }
        }

        // If we can extract file path and don't have cached URL, try to get signed URL
        if (filePath && playbackUrl === voiceUrl) {
          try {
            const { data, error } = await supabase.storage
              .from("group-voice")
              .createSignedUrl(filePath, 3600);

            if (!error && data?.signedUrl) {
              playbackUrl = data.signedUrl;
              // Cache the signed URL (expires in 1 hour = 3600 seconds)
              const expiresAt = Date.now() + (3600 * 1000) - 60000; // Subtract 1 minute for safety
              setVoiceUrlCache((prev) => ({
                ...prev,
                [filePath]: {
                  signedUrl: data.signedUrl,
                  expiresAt: expiresAt,
                },
              }));
            }
          } catch (e) {
            // If signed URL fails, try using the public URL
            console.log('Failed to create signed URL, using public URL');
          }
        }

        // Create and load sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: playbackUrl },
          { 
            shouldPlay: true,
            isLooping: false,
          }
        );

        setVoicePlayers((prev) => ({
          ...prev,
          [messageId]: sound,
        }));
        setPlayingVoiceId(messageId);

        // Listen for playback status updates (progress and finish)
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setPlayingVoiceId(null);
              setVoiceProgress((prev) => {
                const updated = { ...prev };
                delete updated[messageId];
                return updated;
              });
            } else {
              // Update progress
              const currentTime = status.positionMillis / 1000; // Convert to seconds
              const duration = status.durationMillis ? status.durationMillis / 1000 : null;
              setVoiceProgress((prev) => ({
                ...prev,
                [messageId]: {
                  currentTime,
                  duration,
                  isPlaying: status.isPlaying,
                },
              }));
            }
          }
        });
      }
    } catch (err) {
      console.error('Voice playback error:', err);
      Alert.alert('Error', `Failed to play voice: ${err.message || 'Unknown error'}`);
      setPlayingVoiceId(null);
    }
  };

  // Extract file path from Supabase storage URL for voice
  const extractVoiceFilePath = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      
      // Handle both public URLs and signed URLs
      // Public URL format: /storage/v1/object/public/group-voice/school1/class1/voice-123.m4a
      // Signed URL format: /storage/v1/object/sign/group-voice/...?token=...
      const bucketIndex = pathParts.findIndex(part => part === 'group-voice');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Get everything after 'group-voice'
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      // Alternative: check if URL contains 'group-voice' in pathname
      const pathname = urlObj.pathname;
      const groupVoiceIndex = pathname.indexOf('group-voice/');
      if (groupVoiceIndex !== -1) {
        const afterGroupVoice = pathname.substring(groupVoiceIndex + 'group-voice/'.length);
        // Remove query parameters if any
        const filePath = afterGroupVoice.split('?')[0];
        return filePath || null;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // Timer for recording duration
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);


  const renderMessage = ({ item }) => {
    return (
      <MessageItem
        item={item}
        currentUserId={currentUserId}
        chatType={chatType}
        attachmentData={attachmentData}
        voiceData={voiceData}
        setVoiceData={setVoiceData}
        downloadingAttachments={downloadingAttachments}
        playingVoiceId={playingVoiceId}
        voiceProgress={voiceProgress}
        handleDownloadAttachment={handleDownloadAttachment}
        handlePlayVoice={handlePlayVoice}
        onImagePress={(url, name) => setImagePreview({ url, name })}
      />
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(0)}
      >
        {/* Header */}
        <ChatHeader
          chatName={chatName}
          chatImage={groupImageUrl || groupImage || chatImage}
          chatType={chatType}
          memberCount={memberCount}
          onBack={() => router.back()}
          onGroupInfoPress={() => {
            router.push({
              pathname: '/screens/groupInfo',
              params: {
                chatId: chatId.toString(),
                chatName: chatName,
                chatImage: groupImage || chatImage || '',
              },
            });
          }}
        />


        {/* Messages List */}
        {isLoadingMessages ? (
          <MessageSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            inverted={false}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            onScrollToIndexFailed={(info) => {
              // Handle scroll to index failure gracefully
              console.log('Scroll to index failed:', info);
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#1CACF3" />
                  <Text style={styles.loadMoreText}>Loading older messages...</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              Object.keys(typingUsers).length > 0 ? (
                <TypingIndicator
                  userNames={Object.values(typingUsers).map((user) => user.name)}
                  userCount={Object.keys(typingUsers).length}
                />
              ) : null
            }
            onContentSizeChange={() => {
              // Auto scroll when content size changes (new messages or typing indicator)
              // Only auto-scroll if we're near the bottom (not loading older messages) and not during pagination
              if (flatListRef.current && !isLoadingMore && !isLoadingMoreRef.current && !isPaginationInProgressRef.current) {
                // Only auto-scroll for new messages at the bottom, not when loading older messages at top
                setTimeout(() => {
                  if (!isPaginationInProgressRef.current) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }, 100);
              }
            }}
          />
        )}

        {/* Image Preview Modal */}
        <Modal
          visible={!!imagePreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImagePreview(null)}
        >
          <View style={styles.imagePreviewModal}>
            <TouchableOpacity
              style={styles.imagePreviewBackdrop}
              activeOpacity={1}
              onPress={() => setImagePreview(null)}
            >
              <View style={styles.imagePreviewContainer}>
                <TouchableOpacity
                  style={styles.imagePreviewCloseButton}
                  onPress={() => setImagePreview(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.imagePreviewCloseText}>✕</Text>
                </TouchableOpacity>
                {imagePreview && (
                  <Image
                    source={{ uri: imagePreview.url }}
                    style={styles.imagePreviewImage}
                    contentFit="contain"
                    cachePolicy="disk"
                  />
                )}
                {imagePreview?.name && (
                  <Text style={styles.imagePreviewName} numberOfLines={1}>
                    {imagePreview.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {isRecording ? (
            <RecordingControls
              recordingDuration={recordingDuration}
              onCancel={handleCancelRecording}
              onStop={handleStopRecording}
            />
          ) : (
            <>
              {/* Attachment Preview */}
              {attachment && (
                <AttachmentPreview
                  attachment={attachment}
                  isUploading={isUploading}
                  onRemove={() => setAttachment(null)}
                  onSend={handleSendAttachment}
                />
              )}
              <ChatInput
                messageText={messageText}
                isSendingMessage={isSendingMessage}
                isUploading={isUploading}
                onTextChange={(text) => {
                  setMessageText(text);
                  handleTyping(text.length > 0);
                }}
                onSendMessage={handleSendMessage}
                onAttachmentPress={handleAttachmentPress}
                onStartRecording={handleStartRecording}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default chatDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: hp(2.5),
    color: '#111827',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    marginRight: 12,
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
  },
  avatarPlaceholder: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerActionIcon: {
    fontSize: hp(2.5),
    color: '#111827',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messagesListEmpty: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  senderAvatar: {
    width: hp(2),
    height: hp(2),
    borderRadius: hp(1),
    marginRight: 6,
  },
  senderAvatarPlaceholder: {
    width: hp(2),
    height: hp(2),
    borderRadius: hp(1),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  senderAvatarText: {
    fontSize: hp(1),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  senderName: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#1CACF3',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    lineHeight: hp(2.2),
  },
  messageTextLeft: {
    color: '#111827',
  },
  messageTextRight: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    marginRight: 4,
  },
  messageTimeLeft: {
    color: '#9CA3AF',
  },
  messageTimeRight: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  readIndicator: {
    fontSize: hp(1.1),
    color: '#FFFFFF',
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 44,
    maxHeight: 100,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textInput: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    paddingBottom: hp(0.5),
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendIcon: {
    fontSize: hp(2),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    gap: 8,
  },
  removeAttachmentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAttachmentIcon: {
    fontSize: hp(1.4),
    color: '#6B7280',
    fontWeight: '600',
  },
  attachmentPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentPreviewFile: {
    flex: 1,
    justifyContent: 'center',
  },
  attachmentPreviewFileName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  attachmentPreviewFileSize: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  sendAttachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voicePlayIcon: {
    fontSize: hp(2),
    color: '#FFFFFF',
    marginLeft: 2,
  },
  voicePlayIconRight: {
    color: '#FFFFFF',
  },
  voiceMessageInfo: {
    flex: 1,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    marginBottom: 4,
    gap: 3,
  },
  voiceWaveformBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    borderRadius: 1.5,
  },
  voiceWaveformBarRight: {
    backgroundColor: '#FFFFFF',
  },
  voiceDuration: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  voiceDurationRight: {
    color: '#FFFFFF',
  },
  attachmentMessageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 150,
    maxWidth: '80%',
  },
  attachmentImagePreview: {
    width: hp(5),
    height: hp(5),
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentImageInfo: {
    width: '100%',
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachmentIconText: {
    fontSize: hp(2),
  },
  attachmentIconTextRight: {
    // Same for both sides
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentFileName: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  attachmentFileNameRight: {
    color: '#FFFFFF',
  },
  attachmentDownloadText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
  attachmentDownloadTextRight: {
    color: '#FFFFFF',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  cancelRecordingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelIcon: {
    fontSize: hp(1.8),
    color: '#EF4444',
    fontWeight: '600',
  },
  recordingInfo: {
    flex: 1,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#991B1B',
  },
  stopRecordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  stopIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
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
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 3,
  },
  typingText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  imagePreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePreviewCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imagePreviewCloseText: {
    fontSize: hp(2.5),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imagePreviewImage: {
    width: '100%',
    height: '80%',
    maxWidth: '100%',
    maxHeight: '80%',
  },
  imagePreviewName: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
});

