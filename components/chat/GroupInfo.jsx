import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Pen from '../../assets/icons/Pen';
import RightArrow from '../../assets/icons/RightArrow';
import { hp } from '../../helpers/common';
import { useLazyGetCoordinatorsByBranchPaginatedQuery } from '../../redux/api/coordinator';
import { useLazyGetOwnersPaginatedQuery } from '../../redux/api/ownerApi';
import { useLazyGetPrincipalsByBranchPaginatedQuery } from '../../redux/api/principalApi';
import { useLazyGetProfileByRoleQuery } from '../../redux/api/profileApi';
import { useGetTeachersByBranchPaginatedQuery, useLazyGetTeachersByBranchPaginatedQuery } from '../../redux/api/teacherApi';
import { supabase } from '../../supabaseClient';

const GroupInfo = ({
  visible,
  onClose,
  chatId,
  chatName: initialChatName,
  chatImage: initialChatImage,
  chatType,
  currentUserId,
  userRole,
  branchId,
  schoolId,
  canEdit,
}) => {
  const [chatName, setChatName] = useState(initialChatName || '');
  const [chatImage, setChatImage] = useState(initialChatImage || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); // For owners, principals, coordinators
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [getProfileByRole] = useLazyGetProfileByRoleQuery();
  const [userImageCache, setUserImageCache] = useState({}); // Cache for user image signed URLs
  const [triggerOwners] = useLazyGetOwnersPaginatedQuery();
  const [triggerPrincipals] = useLazyGetPrincipalsByBranchPaginatedQuery();
  const [triggerCoordinators] = useLazyGetCoordinatorsByBranchPaginatedQuery();

  const MEMBER_PAGE_SIZE = 10;
  const TEACHER_PAGE_SIZE = 10;

  const [teachersList, setTeachersList] = useState([]);
  const [teachersOffset, setTeachersOffset] = useState(0);
  const [hasMoreTeachers, setHasMoreTeachers] = useState(true);
  const { data: initialTeachersData } = useGetTeachersByBranchPaginatedQuery(
    { branchId, offset: 0, limit: TEACHER_PAGE_SIZE },
    { skip: !branchId || selectedRole !== 'teachers' }
  );
  const [triggerTeachers, { isFetching: isFetchingTeachers }] = useLazyGetTeachersByBranchPaginatedQuery();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setChatName(initialChatName || '');
      setChatImage(initialChatImage || '');
      setIsEditingName(false);
      setIsEditingImage(false);
      setShowAddMembers(false);
      setSelectedRole(null);
      setSelectedTeachers([]);
      setSelectedUsers([]);
      setUsersList([]);
      setTeachersList([]);
      fetchMembers();
    }
  }, [visible, chatId]);

  // Load teachers when role is selected
  useEffect(() => {
    if (selectedRole === 'teachers' && branchId && visible) {
      if (initialTeachersData?.items) {
        setTeachersList(initialTeachersData.items);
        setTeachersOffset(initialTeachersData.items.length);
        setHasMoreTeachers(initialTeachersData.items.length === TEACHER_PAGE_SIZE);
      } else {
        loadTeachers(0);
      }
    } else if (selectedRole === 'teachers' && branchId && visible) {
      // Teachers are already handled above
    } else if (selectedRole && ['owner', 'principal', 'coordinator'].includes(selectedRole) && visible) {
      loadUsersByRole(selectedRole);
    }
  }, [selectedRole, branchId, visible, initialTeachersData]);

  const fetchMembers = async () => {
    if (!chatId) return;
    setIsLoadingMembers(true);
    try {
      // Fetch from chat_members_view which already joins user_profiles
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members_view")
        .select("*")
        .eq("chat_Id", chatId)
        .order("joined_at", { ascending: false })
        .limit(MEMBER_PAGE_SIZE);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        setMembers([]);
        return;
      }

      if (membersData && membersData.length > 0) {
        setMembers(membersData);
        setHasMoreMembers(membersData.length === MEMBER_PAGE_SIZE);
      } else {
        setMembers([]);
        setHasMoreMembers(false);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadMoreMembers = async () => {
    if (!chatId || isLoadingMore || !hasMoreMembers || members.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldestMember = members[members.length - 1];
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members_view")
        .select("*")
        .eq("chat_Id", chatId)
        .lt("joined_at", oldestMember.joined_at)
        .order("joined_at", { ascending: false })
        .limit(MEMBER_PAGE_SIZE);

      if (membersError) {
        console.error('Error loading more members:', membersError);
        return;
      }

      if (membersData && membersData.length > 0) {
        setMembers((prev) => [...prev, ...membersData]);
        setHasMoreMembers(membersData.length === MEMBER_PAGE_SIZE);
      } else {
        setHasMoreMembers(false);
      }
    } catch (err) {
      console.error('Error loading more members:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadTeachers = async (offset = 0) => {
    if (!branchId || isLoadingTeachers) return;
    setIsLoadingTeachers(true);
    try {
      const result = await triggerTeachers({ branchId, offset, limit: TEACHER_PAGE_SIZE }).unwrap();
      const items = result?.items || [];
      setTeachersList((prev) => (offset === 0 ? items : [...prev, ...items]));
      setTeachersOffset(offset + items.length);
      setHasMoreTeachers(items.length === TEACHER_PAGE_SIZE);
    } catch (e) {
      console.error('Error loading teachers:', e);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!chatId || !canEdit) return;
    if (!chatName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from("chat")
        .update({ group_Name: chatName.trim() })
        .eq("id", chatId);

      if (error) {
        Alert.alert('Error', 'Failed to update group name');
        return;
      }

      setIsEditingName(false);
      Alert.alert('Success', 'Group name updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handlePickGroupImage = async () => {
    if (!chatId || !canEdit) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await handleUpdateGroupImage(imageUri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateGroupImage = async (imageUri) => {
    if (!chatId || !canEdit) return;

    try {
      setIsEditingImage(true);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Selected image no longer exists');
        setIsEditingImage(false);
        return;
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        Alert.alert('Error', 'Failed to read image content');
        setIsEditingImage(false);
        return;
      }

      // Convert base64 to arrayBuffer
      const arrayBuffer = decode(base64);

      // Generate a unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${chatId}-${Date.now()}.${fileExt}`;
      const filePath = `group-images/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image');
        setIsEditingImage(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('group-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl;

      if (!imageUrl) {
        Alert.alert('Error', 'Failed to get image URL');
        setIsEditingImage(false);
        return;
      }

      // Update chat table
      const { error: updateError } = await supabase
        .from("chat")
        .update({ group_Image: imageUrl })
        .eq("id", chatId);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Failed to update group image');
        setIsEditingImage(false);
        return;
      }

      setChatImage(imageUrl);
      setIsEditingImage(false);
      Alert.alert('Success', 'Group image updated');
    } catch (err) {
      console.error('Error updating group image:', err);
      Alert.alert('Error', 'Failed to update group image');
      setIsEditingImage(false);
    }
  };

  // Extract file path from user image URL (similar to extractAttachmentFilePath)
  const extractUserImageFilePath = (url) => {
    if (!url) return null;
    
    try {
      // If it's already just a path (not a full URL), return as is
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }

      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Try to find common bucket patterns in the path
      const bucketPatterns = [
        'user-profiles/',
        'profiles/',
        'user-images/',
        'avatars/',
        'group-images/',
      ];
      
      for (const pattern of bucketPatterns) {
        const bucketIndex = pathname.indexOf(pattern);
        if (bucketIndex !== -1) {
          const afterBucket = pathname.substring(bucketIndex + pattern.length);
          const filePath = afterBucket.split('?')[0];
          return filePath || null;
        }
      }
      
      // If no bucket pattern found, try to extract from pathname directly
      // Remove leading slash and query params
      const cleanPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      const filePath = cleanPath.split('?')[0];
      return filePath || null;
    } catch (e) {
      return null;
    }
  };

  // Get signed URL for user image
  const getUserImageSignedUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    // If it's already a full URL (http/https), try to extract path and get signed URL
    // Check cache first
    if (userImageCache[imageUrl]) {
      const cachedData = userImageCache[imageUrl];
      const now = Date.now();
      if (cachedData.expiresAt > now) {
        return cachedData.signedUrl;
      } else {
        // Cache expired, remove it
        setUserImageCache((prev) => {
          const updated = { ...prev };
          delete updated[imageUrl];
          return updated;
        });
      }
    }

    try {
      // Extract file path from URL
      const filePath = extractUserImageFilePath(imageUrl);
      if (!filePath) {
        // If we can't extract path, return original URL
        return imageUrl;
      }

      // Try common bucket names for user profiles
      const bucketNames = ['user-profiles', 'profiles', 'user-images', 'avatars', 'group-images'];
      
      for (const bucketName of bucketNames) {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600);

        if (!error && data?.signedUrl) {
          const expiresAt = Date.now() + (3600 * 1000) - 60000; // 1 hour minus 1 minute
          setUserImageCache((prev) => ({
            ...prev,
            [imageUrl]: {
              signedUrl: data.signedUrl,
              expiresAt: expiresAt,
            },
          }));
          return data.signedUrl;
        }
      }
    } catch (e) {
      console.log('Failed to create signed URL for user image:', e);
    }

    // If all else fails, return original URL
    return imageUrl;
  };

  const loadUsersByRole = async (role) => {
    if (!role || isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      let usersData = [];
      
      if (role === 'owner') {
        // Fetch owner from school table
        if (!schoolId) {
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }
        const { data: schoolData, error: schoolError } = await supabase
          .from("school")
          .select("owner_Id")
          .eq("id", schoolId)
          .maybeSingle();

        if (schoolError || !schoolData?.owner_Id) {
          console.error('Error fetching school owner:', schoolError);
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }

        // Get owner profile using owner_Id
        const { data: ownerData, error: ownerError } = await supabase
          .from("owner_with_additional_info")
          .select("*")
          .eq("auth_User_Id", schoolData.owner_Id)
          .maybeSingle();

        if (!ownerError && ownerData) {
          usersData = [{
            id: ownerData.auth_User_Id,
            email: ownerData.email || '',
            full_Name: ownerData.full_Name || ownerData.name || '',
            user_Image: ownerData.user_Image || null,
          }];
        }
      } else if (role === 'principal') {
        // Fetch principal from principal_profile where school_Id matches
        if (!schoolId) {
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }
        const { data: principalsData, error: principalsError } = await supabase
          .from("principal_profile")
          .select("*")
          .eq("school_Id", schoolId);

        if (!principalsError && principalsData) {
          usersData = principalsData.map((principal) => ({
            id: principal.auth_Id,
            email: principal.email || '',
            full_Name: principal.full_Name || principal.name || '',
            user_Image: principal.user_Image || null,
          }));
        }
      } else if (role === 'coordinator') {
        // Fetch coordinators from coordinator_profile where school_Id matches
        if (!schoolId) {
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }
        const { data: coordinatorsData, error: coordinatorsError } = await supabase
          .from("coordinator_profile")
          .select("*")
          .eq("school_Id", schoolId);

        if (!coordinatorsError && coordinatorsData) {
          usersData = coordinatorsData.map((coordinator) => ({
            id: coordinator.auth_Id,
            email: coordinator.email || '',
            full_Name: coordinator.full_Name || coordinator.name || '',
            user_Image: coordinator.user_Image || null,
          }));
        }
      }

      setUsersList(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsersList([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSelectTeacher = (teacherId) => {
    setSelectedTeachers((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((id) => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAddSelectedMembers = async () => {
    if (!chatId) return;
    
    let membersToAdd = [];
    let roleToUse = '';

    if (selectedRole === 'teachers' && selectedTeachers.length > 0) {
      membersToAdd = selectedTeachers.map((teacherId) => ({
        chat_Id: chatId,
        user_Id: teacherId,
        role: "teacher",
      }));
      roleToUse = 'teacher';
    } else if (selectedUsers.length > 0) {
      membersToAdd = selectedUsers.map((userId) => ({
        chat_Id: chatId,
        user_Id: userId,
        role: selectedRole,
      }));
      roleToUse = selectedRole;
    }

    if (membersToAdd.length === 0) return;

    setIsAddingMembers(true);
    try {
      const { error } = await supabase
        .from("chat_member")
        .insert(membersToAdd);

      if (error) {
        Alert.alert('Error', 'Failed to add members');
        return;
      }

      Alert.alert('Success', `${membersToAdd.length} member(s) added`);
      setSelectedTeachers([]);
      setSelectedUsers([]);
      setSelectedRole(null);
      setShowAddMembers(false);
      fetchMembers(); // Refresh members list
    } catch (err) {
      Alert.alert('Error', 'Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId, userId) => {
    if (!canEdit) return;
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use chat_member table for delete operation (views are read-only)
              const { error } = await supabase
                .from("chat_member")
                .delete()
                .eq("id", memberId);

              if (error) {
                Alert.alert('Error', 'Failed to remove member');
                return;
              }

              setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
              Alert.alert('Success', 'Member removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  // Component for rendering member with signed URL
  const MemberItem = React.memo(({ item: memberItem, onRemoveMember, canEditMember, currentUserIdMember }) => {
    const userName = memberItem.full_Name || `User ${memberItem.user_Id?.substring(0, 8)}`;
    const memberRole = memberItem.role || 'member';
    const [userImageUrl, setUserImageUrl] = useState(memberItem.user_Image);

    // Get signed URL for user image
    useEffect(() => {
      if (memberItem.user_Image) {
        getUserImageSignedUrl(memberItem.user_Image).then((signedUrl) => {
          if (signedUrl) {
            setUserImageUrl(signedUrl);
          }
        });
      } else {
        setUserImageUrl(null);
      }
    }, [memberItem.user_Image]);

    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          {userImageUrl ? (
            <Image source={{ uri: userImageUrl }} style={styles.memberAvatarImage} cachePolicy="disk" />
          ) : (
            <Text style={styles.memberAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{userName}</Text>
          <Text style={styles.memberRole}>{memberRole}</Text>
        </View>
        {canEditMember && memberItem.user_Id !== currentUserIdMember && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveMember(memberItem.member_id, memberItem.user_Id)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={hp(2.5)} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  });

  const renderMember = ({ item }) => {
    return (
      <MemberItem
        item={item}
        onRemoveMember={handleRemoveMember}
        canEditMember={canEdit}
        currentUserIdMember={currentUserId}
      />
    );
  };

  const renderTeacher = ({ item }) => {
    const isSelected = selectedTeachers.includes(item.auth_User_Id);
    return (
      <TouchableOpacity
        style={[styles.teacherItem, isSelected && styles.teacherItemSelected]}
        onPress={() => handleSelectTeacher(item.auth_User_Id)}
        activeOpacity={0.7}
      >
        <View style={styles.teacherAvatar}>
          <Text style={styles.teacherAvatarText}>
            {(item.full_Name || item.email || 'T').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>
            {item.full_Name || item.email?.split('@')[0] || 'Teacher'}
          </Text>
          <Text style={styles.teacherEmail}>{item.email || ''}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={hp(2.5)} color="#1CACF3" />
        )}
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.backIcon}>
              <View style={styles.arrowContainer}>
                <RightArrow color="#111827" strokeWidth="2.5" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Group Image and Name */}
        <View style={styles.groupHeader}>
          <TouchableOpacity
            style={styles.groupImageContainer}
            onPress={() => canEdit && handlePickGroupImage()}
            disabled={!canEdit || isEditingImage}
            activeOpacity={canEdit ? 0.7 : 1}
          >
            {chatImage ? (
              <Image source={{ uri: chatImage }} style={styles.groupImage} cachePolicy="disk" />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Text style={styles.groupImageText}>
                  {chatName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {canEdit && !isEditingImage && (
              <View style={styles.editImageOverlay}>
                <Ionicons name="camera" size={hp(2)} color="#FFFFFF" />
              </View>
            )}
            {isEditingImage && (
              <View style={styles.editImageOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={chatName}
                onChangeText={setChatName}
                placeholder="Group name"
                autoFocus
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateGroupName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setChatName(initialChatName || '');
                  setIsEditingName(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.groupName}>{chatName}</Text>
              {canEdit && (
                <TouchableOpacity
                  style={styles.editNameButton}
                  onPress={() => setIsEditingName(true)}
                  activeOpacity={0.7}
                >
                  <Pen size={hp(1.8)} color="#1CACF3" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            {canEdit && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddMembers(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={hp(2.5)} color="#1CACF3" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingMembers ? (
            <ActivityIndicator size="small" color="#1CACF3" style={styles.loader} />
          ) : members.length === 0 ? (
            <Text style={styles.emptyText}>No members</Text>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => String(item.member_id)}
              renderItem={renderMember}
              onEndReached={loadMoreMembers}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                isLoadingMore ? (
                  <ActivityIndicator size="small" color="#1CACF3" style={styles.loader} />
                ) : null
              }
            />
          )}
        </View>

        {/* Add Members Modal */}
        {showAddMembers && (
          <View style={styles.addMembersOverlay}>
            <View style={styles.addMembersContainer}>
              <View style={styles.addMembersHeader}>
                <Text style={styles.addMembersTitle}>Add Members</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddMembers(false);
                    setSelectedRole(null);
                    setSelectedTeachers([]);
                    setSelectedUsers([]);
                  }}
                >
                  <Ionicons name="close" size={hp(2.5)} color="#111827" />
                </TouchableOpacity>
              </View>

              {!selectedRole ? (
                <View style={styles.roleOptions}>
                  <TouchableOpacity
                    style={styles.roleOption}
                    onPress={() => setSelectedRole('owner')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleOptionText}>Owner</Text>
                    <Ionicons name="chevron-forward" size={hp(2)} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.roleOption}
                    onPress={() => setSelectedRole('principal')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleOptionText}>Principal</Text>
                    <Ionicons name="chevron-forward" size={hp(2)} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.roleOption}
                    onPress={() => setSelectedRole('coordinator')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleOptionText}>Coordinator</Text>
                    <Ionicons name="chevron-forward" size={hp(2)} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.roleOption}
                    onPress={() => setSelectedRole('teachers')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleOptionText}>Teachers</Text>
                    <Ionicons name="chevron-forward" size={hp(2)} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ) : selectedRole === 'teachers' ? (
                <View style={styles.teachersContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedRole(null)}
                  >
                    <Ionicons name="arrow-back" size={hp(2)} color="#1CACF3" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  {selectedTeachers.length > 0 && (
                    <View style={styles.selectedCount}>
                      <Text style={styles.selectedCountText}>
                        {selectedTeachers.length} selected
                      </Text>
                      <TouchableOpacity
                        style={styles.addSelectedButton}
                        onPress={handleAddSelectedMembers}
                        disabled={isAddingMembers}
                      >
                        {isAddingMembers ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.addSelectedButtonText}>Add Selected</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {isLoadingTeachers && teachersList.length === 0 ? (
                    <ActivityIndicator size="small" color="#1CACF3" style={styles.loader} />
                  ) : (
                    <FlatList
                      data={teachersList}
                      keyExtractor={(item) => String(item.auth_User_Id)}
                      renderItem={renderTeacher}
                      onEndReached={() => {
                        if (hasMoreTeachers && !isLoadingTeachers) {
                          loadTeachers(teachersOffset);
                        }
                      }}
                      onEndReachedThreshold={0.1}
                      ListFooterComponent={
                        isLoadingTeachers ? (
                          <ActivityIndicator size="small" color="#1CACF3" style={styles.loader} />
                        ) : null
                      }
                    />
                  )}
                </View>
              ) : ['owner', 'principal', 'coordinator'].includes(selectedRole) ? (
                <View style={styles.teachersContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setSelectedRole(null);
                      setSelectedUsers([]);
                    }}
                  >
                    <Ionicons name="arrow-back" size={hp(2)} color="#1CACF3" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  {selectedUsers.length > 0 && (
                    <View style={styles.selectedCount}>
                      <Text style={styles.selectedCountText}>
                        {selectedUsers.length} selected
                      </Text>
                      <TouchableOpacity
                        style={styles.addSelectedButton}
                        onPress={handleAddSelectedMembers}
                        disabled={isAddingMembers}
                      >
                        {isAddingMembers ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.addSelectedButtonText}>Add Selected</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {isLoadingUsers && usersList.length === 0 ? (
                    <ActivityIndicator size="small" color="#1CACF3" style={styles.loader} />
                  ) : (
                    <FlatList
                      data={usersList}
                      keyExtractor={(item) => String(item.id)}
                      renderItem={({ item }) => {
                        const isSelected = selectedUsers.includes(item.id);
                        const userName = item.full_Name || item.email?.split('@')[0] || 'User';
                        return (
                          <TouchableOpacity
                            style={[styles.teacherItem, isSelected && styles.teacherItemSelected]}
                            onPress={() => handleSelectUser(item.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.teacherAvatar}>
                              {item.user_Image ? (
                                <Image 
                                  source={{ uri: item.user_Image }}
                                  cachePolicy="disk" 
                                  style={styles.teacherAvatarImage} 
                                />
                              ) : (
                                <Text style={styles.teacherAvatarText}>
                                  {userName.charAt(0).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View style={styles.teacherInfo}>
                              <Text style={styles.teacherName}>
                                {userName}
                              </Text>
                              {item.email && (
                                <Text style={styles.teacherEmail}>{item.email}</Text>
                              )}
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={hp(2.5)} color="#1CACF3" />
                            )}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.roleNotImplemented}>
                  <Text style={styles.roleNotImplementedText}>
                    Adding {selectedRole}s is not yet implemented
                  </Text>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedRole(null)}
                  >
                    <Ionicons name="arrow-back" size={hp(2)} color="#1CACF3" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  groupImage: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
  },
  groupImagePlaceholder: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupImageText: {
    fontSize: hp(4),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: hp(2.2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  editNameButton: {
    padding: 4,
  },
  nameEditContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1CACF3',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  loader: {
    marginVertical: 16,
  },
  emptyText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberAvatarText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  memberCanSend: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  addMembersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  addMembersContainer: {
    flex: 1,
    paddingTop: 16,
  },
  addMembersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addMembersTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  roleOptions: {
    paddingTop: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roleOptionText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  teachersContainer: {
    flex: 1,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedCountText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  addSelectedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1CACF3',
    borderRadius: 8,
  },
  addSelectedButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  teacherItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  teacherAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  teacherAvatarImage: {
    width: '100%',
    height: '100%',
  },
  teacherAvatarText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  teacherEmail: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  roleNotImplemented: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  roleNotImplementedText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default GroupInfo;

