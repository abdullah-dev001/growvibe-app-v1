import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import Pen from '../../assets/icons/Pen';
import RightArrow from '../../assets/icons/RightArrow';
import { hp } from '../../helpers/common';
import { useLazyGetCoordinatorsByBranchPaginatedQuery } from '../../redux/api/coordinator';
import { useLazyGetOwnersPaginatedQuery } from '../../redux/api/ownerApi';
import { useGetPrincipalsByBranchQuery } from '../../redux/api/principalApi';
import { useGetTeachersByBranchPaginatedQuery, useLazyGetTeachersByBranchPaginatedQuery } from '../../redux/api/teacherApi';
import { supabase } from '../../supabaseClient';
import ScreenWrapper from '../../components/ScreenWrapper';

const groupInfo = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, branchId, schoolId } = useSelector((state) => state.auth);
  
  const chatId = params.chatId ? parseInt(params.chatId) : null;
  const canEdit = user?.role === 'owner' || user?.role === 'principal' || user?.role === 'coordinator';

  const [chatName, setChatName] = useState(params.chatName || '');
  const [chatImage, setChatImage] = useState(params.chatImage || '');
  const [groupImageUrl, setGroupImageUrl] = useState(null); // Signed URL for group image
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [teachersOffset, setTeachersOffset] = useState(0);
  const [hasMoreTeachers, setHasMoreTeachers] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  const MEMBER_PAGE_SIZE = 20;
  const TEACHER_PAGE_SIZE = 12;

  // Module-level cache that persists across component remounts
  const memberImageCacheRef = React.useRef({});

  // Fetch principal of the branch
  const { data: principalsData } = useGetPrincipalsByBranchQuery(branchId, { skip: !branchId });
  const principal = principalsData?.[0] || null;

  // Fetch teachers
  const { data: initialTeachersData } = useGetTeachersByBranchPaginatedQuery(
    { branchId, offset: 0, limit: TEACHER_PAGE_SIZE },
    { skip: !branchId || !showManageMembers || selectedRole !== 'teachers' }
  );
  const [triggerTeachers] = useLazyGetTeachersByBranchPaginatedQuery();

  // Fetch owner
  const [triggerOwner] = useLazyGetOwnersPaginatedQuery();

  // Fetch coordinators
  const [triggerCoordinators] = useLazyGetCoordinatorsByBranchPaginatedQuery();

  useEffect(() => {
    if (chatId) {
      fetchMembers();
    }
  }, [chatId]);

  // Get signed URL for group image
  useEffect(() => {
    if (chatImage) {
      // Extract file path from group image URL
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
        const filePath = extractGroupImagePath(chatImage);
        if (!filePath) {
          // If we can't extract path, use original URL (might already be a signed URL or public URL)
          setGroupImageUrl(chatImage);
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
            console.log('Error creating signed URL for group image:', error);
            // Fallback to original URL
            setGroupImageUrl(chatImage);
          }
        } catch (e) {
          console.log('Failed to create signed URL for group image:', e);
          // Fallback to original URL
          setGroupImageUrl(chatImage);
        }
      };

      getGroupImageSignedUrl();
    } else {
      setGroupImageUrl(null);
    }
  }, [chatImage]);

  useEffect(() => {
    if (showManageMembers && selectedRole === 'teachers' && branchId && initialTeachersData?.items) {
      setTeachersList(initialTeachersData.items);
      setTeachersOffset(initialTeachersData.items.length);
      setHasMoreTeachers(initialTeachersData.items.length === TEACHER_PAGE_SIZE);
    }
  }, [initialTeachersData, showManageMembers, selectedRole, branchId]);

  const fetchMembers = async () => {
    if (!chatId) return;
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("chat_members_view")
        .select("*")
        .eq("chat_Id", chatId)
        .order("joined_at", { ascending: false })
        .limit(MEMBER_PAGE_SIZE);

      if (error) {
        console.error('Error fetching members:', error);
        setMembers([]);
        return;
      }

      setMembers(data || []);
      setHasMoreMembers((data || []).length === MEMBER_PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadMoreMembers = async () => {
    if (isLoadingMore || !hasMoreMembers || !chatId) return;
    setIsLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from("chat_members_view")
        .select("*")
        .eq("chat_Id", chatId)
        .order("joined_at", { ascending: false })
        .range(members.length, members.length + MEMBER_PAGE_SIZE - 1);

      if (error) {
        console.error('Error loading more members:', error);
        return;
      }

      if (data && data.length > 0) {
        setMembers((prev) => [...prev, ...data]);
        setHasMoreMembers(data.length === MEMBER_PAGE_SIZE);
      } else {
        setHasMoreMembers(false);
      }
    } catch (err) {
      console.error('Error loading more members:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!chatId || !canEdit || !chatName.trim()) return;

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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUpdateGroupImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateGroupImage = async (imageUri) => {
    if (!chatId || !canEdit || !schoolId) return;

    try {
      setIsEditingImage(true);

      // Get classId from chat table
      const { data: chatData, error: chatError } = await supabase
        .from("chat")
        .select("class_Id")
        .eq("id", chatId)
        .maybeSingle();

      if (chatError || !chatData?.class_Id) {
        Alert.alert('Error', 'Failed to get class information');
        setIsEditingImage(false);
        return;
      }

      const classId = chatData.class_Id;

      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Selected image no longer exists');
        setIsEditingImage(false);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        Alert.alert('Error', 'Failed to read image content');
        setIsEditingImage(false);
        return;
      }

      const arrayBuffer = decode(base64);
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `attachment-${Date.now()}.${fileExt}`;
      const filePath = `school${schoolId}/class${classId}/group-profile/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-attachments')
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

      const { data: urlData } = supabase.storage
        .from('group-attachments')
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl;

      if (!imageUrl) {
        Alert.alert('Error', 'Failed to get image URL');
        setIsEditingImage(false);
        return;
      }

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

  const loadUsersByRole = async (role) => {
    if (!role || isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      let usersData = [];
      
      if (role === 'owner') {
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
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }

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
        // Show only the principal of this branch
        if (principal) {
          usersData = [{
            id: principal.auth_User_Id,
            email: principal.email || '',
            full_Name: principal.full_Name || principal.name || '',
            user_Image: principal.user_Image || null,
          }];
        }
      } else if (role === 'coordinator') {
        if (!branchId) {
          setUsersList([]);
          setIsLoadingUsers(false);
          return;
        }
        const result = await triggerCoordinators({ branchId, offset: 0, limit: 100 }).unwrap();
        usersData = (result?.items || []).map((coordinator) => ({
          id: coordinator.auth_User_Id,
          email: coordinator.email || '',
          full_Name: coordinator.full_Name || coordinator.name || '',
          user_Image: coordinator.user_Image || null,
        }));
      }

      setUsersList(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsersList([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTeachers = async (offset = 0) => {
    if (!branchId || isLoadingTeachers) return;
    setIsLoadingTeachers(true);
    try {
      const result = await triggerTeachers({ branchId, offset, limit: TEACHER_PAGE_SIZE }).unwrap();
      const items = result?.items || [];
      
      if (offset === 0) {
        setTeachersList(items);
      } else {
        setTeachersList((prev) => [...prev, ...items]);
      }
      
      setTeachersOffset(offset + items.length);
      setHasMoreTeachers(items.length === TEACHER_PAGE_SIZE);
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // Helper function to check if a user is already a member
  const isUserAlreadyMember = (userId) => {
    if (!userId || !members || members.length === 0) return false;
    return members.some((member) => member.user_Id === userId);
  };

  const handleSelectTeacher = (teacherId) => {
    // Don't allow selecting if already a member
    if (isUserAlreadyMember(teacherId)) {
      return;
    }
    
    setSelectedTeachers((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((id) => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const handleSelectUser = (userId) => {
    // Don't allow selecting if already a member
    if (isUserAlreadyMember(userId)) {
      return;
    }
    
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

    if (selectedTeachers.length > 0) {
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
      setShowManageMembers(false);
      fetchMembers();
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

  useEffect(() => {
    if (showManageMembers) {
      if (selectedRole === 'teachers' && branchId) {
        loadTeachers(0);
      } else if (selectedRole && ['owner', 'principal', 'coordinator'].includes(selectedRole)) {
        loadUsersByRole(selectedRole);
      }
    }
  }, [showManageMembers, selectedRole, branchId]);

  // Extract file path from user image URL
  const extractUserImageFilePath = (url) => {
    if (!url) return null;
    
    try {
      // If it's already just a path (not a full URL), return as is
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }

      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Handle Supabase storage URLs - they have structure like:
      // /storage/v1/object/public/bucket-name/path/to/file.jpg
      // or /storage/v1/object/sign/bucket-name/path/to/file.jpg
      const publicIndex = pathname.indexOf('/storage/v1/object/public/');
      const signIndex = pathname.indexOf('/storage/v1/object/sign/');
      
      if (publicIndex !== -1) {
        // Extract path after /storage/v1/object/public/
        const afterPublic = pathname.substring(publicIndex + '/storage/v1/object/public/'.length);
        const filePath = afterPublic.split('?')[0];
        return filePath || null;
      }
      
      if (signIndex !== -1) {
        // Extract path after /storage/v1/object/sign/
        const afterSign = pathname.substring(signIndex + '/storage/v1/object/sign/'.length);
        const filePath = afterSign.split('?')[0];
        return filePath || null;
      }
      
      // Try to find common bucket patterns in the path
      const bucketPatterns = [
        'user-profiles/',
        'profiles/',
        'user-images/',
        'avatars/',
        'group-images/',
        'profile-attachments/',
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
      console.log('Error extracting file path:', e);
      return null;
    }
  };

  // Get signed URL for member profile image
  const getMemberImageSignedUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    // Check cache first (using ref for persistence across remounts)
    const cache = memberImageCacheRef.current;
    if (cache[imageUrl]) {
      const cachedData = cache[imageUrl];
      const now = Date.now();
      if (cachedData.expiresAt > now) {
        return cachedData.signedUrl;
      } else {
        // Cache expired, remove it
        delete cache[imageUrl];
      }
    }

    try {
      // Extract file path from URL
      const filePath = extractUserImageFilePath(imageUrl);
      if (!filePath) {
        // If we can't extract path, return original URL
        return imageUrl;
      }

      // Extract bucket name from file path if it's in the format "bucket-name/path/to/file"
      let bucketName = null;
      let actualFilePath = filePath;
      
      // Check if filePath starts with a bucket name
      const bucketPatterns = ['user-profiles/', 'profiles/', 'user-images/', 'avatars/', 'group-images/', 'profile-attachments/'];
      for (const pattern of bucketPatterns) {
        if (filePath.startsWith(pattern)) {
          bucketName = pattern.replace('/', '');
          actualFilePath = filePath.substring(pattern.length);
          break;
        }
      }
      
      // If bucket name was extracted, use it; otherwise try common buckets
      const bucketNames = bucketName 
        ? [bucketName] 
        : ['profile-attachments', 'user-profiles', 'profiles', 'user-images', 'avatars', 'group-images'];
      
      for (const bucket of bucketNames) {
        const pathToUse = bucketName ? actualFilePath : filePath;
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(pathToUse, 3600);

        if (!error && data?.signedUrl) {
          const expiresAt = Date.now() + (3600 * 1000) - 60000; // 1 hour minus 1 minute
          // Store in persistent cache
          cache[imageUrl] = {
            signedUrl: data.signedUrl,
            expiresAt: expiresAt,
          };
          return data.signedUrl;
        }
      }
    } catch (e) {
      console.log('Failed to create signed URL for member image:', e);
    }

    // If all else fails, return original URL
    return imageUrl;
  };

  // Component for rendering member with signed URL
  const MemberItem = React.memo(({ item: memberItem }) => {
    const userName = memberItem.full_Name || `User ${memberItem.user_Id?.substring(0, 8)}`;
    const memberRole = (memberItem.role || 'member').toLowerCase();
    
    // Check cache first synchronously
    const cache = memberImageCacheRef.current;
    const cachedData = memberItem.user_Image ? cache[memberItem.user_Image] : null;
    const initialUrl = cachedData && cachedData.expiresAt > Date.now() 
      ? cachedData.signedUrl 
      : memberItem.user_Image;
    
    const [userImageUrl, setUserImageUrl] = useState(initialUrl);

    // Get signed URL for user image (only if not in cache)
    useEffect(() => {
      if (memberItem.user_Image) {
        // Check cache again (in case it was updated)
        const currentCache = memberImageCacheRef.current;
        const currentCachedData = currentCache[memberItem.user_Image];
        if (currentCachedData && currentCachedData.expiresAt > Date.now()) {
          setUserImageUrl(currentCachedData.signedUrl);
          return;
        }
        
        getMemberImageSignedUrl(memberItem.user_Image).then((signedUrl) => {
          if (signedUrl && signedUrl !== memberItem.user_Image) {
            setUserImageUrl(signedUrl);
          }
        });
      } else {
        setUserImageUrl(null);
      }
    }, [memberItem.user_Image]);

    const handleMemberPress = () => {
      if (!memberItem.user_Id || !memberRole) return;
      router.push({
        pathname: '/screens/viewProfile',
        params: {
          userId: memberItem.user_Id,
          role: memberRole,
        },
      });
    };

    return (
      <TouchableOpacity style={styles.memberItem} activeOpacity={0.7} onPress={handleMemberPress}>
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
          <Text style={styles.memberRole}>{memberRole.charAt(0).toUpperCase() + memberRole.slice(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  });

  const renderMember = ({ item }) => {
    return <MemberItem item={item} />;
  };

  // Component for rendering teacher with signed URL
  const TeacherItem = React.memo(({ item: teacherItem, isSelected, onSelect }) => {
    // Check if teacher is already a member
    const isAlreadyMember = isUserAlreadyMember(teacherItem.auth_User_Id);
    const isDisabled = isAlreadyMember;
    const showAsSelected = isAlreadyMember || isSelected;

    // Check cache first synchronously
    const cache = memberImageCacheRef.current;
    const cachedData = teacherItem.user_Image ? cache[teacherItem.user_Image] : null;
    const initialUrl = cachedData && cachedData.expiresAt > Date.now() 
      ? cachedData.signedUrl 
      : teacherItem.user_Image;
    
    const [userImageUrl, setUserImageUrl] = useState(initialUrl);

    // Get signed URL for user image (only if not in cache)
    useEffect(() => {
      if (teacherItem.user_Image) {
        // Check cache again (in case it was updated)
        const currentCache = memberImageCacheRef.current;
        const currentCachedData = currentCache[teacherItem.user_Image];
        if (currentCachedData && currentCachedData.expiresAt > Date.now()) {
          setUserImageUrl(currentCachedData.signedUrl);
          return;
        }
        
        getMemberImageSignedUrl(teacherItem.user_Image).then((signedUrl) => {
          if (signedUrl && signedUrl !== teacherItem.user_Image) {
            setUserImageUrl(signedUrl);
          }
        });
      } else {
        setUserImageUrl(null);
      }
    }, [teacherItem.user_Image]);

    return (
      <TouchableOpacity
        style={[
          styles.teacherItem, 
          showAsSelected && styles.teacherItemSelected,
          isDisabled && styles.teacherItemDisabled
        ]}
        onPress={isDisabled ? undefined : onSelect}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={styles.teacherAvatar}>
          {userImageUrl ? (
            <Image source={{ uri: userImageUrl }} style={styles.teacherAvatarImage} cachePolicy="disk" />
          ) : (
            <Text style={styles.teacherAvatarText}>
              {(teacherItem.full_Name || teacherItem.email || 'T').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>
            {teacherItem.full_Name || teacherItem.email?.split('@')[0] || 'Teacher'}
          </Text>
          <Text style={styles.teacherEmail}>{teacherItem.email || ''}</Text>
          {isAlreadyMember && (
            <Text style={styles.alreadyMemberText}>Already a member</Text>
          )}
        </View>
        {showAsSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={hp(2.5)} 
            color={isDisabled ? "#6B7280" : "#1CACF3"} 
          />
        )}
      </TouchableOpacity>
    );
  });

  const renderTeacher = ({ item }) => {
    return (
      <TeacherItem
        item={item}
        isSelected={selectedTeachers.includes(item.auth_User_Id)}
        onSelect={() => handleSelectTeacher(item.auth_User_Id)}
      />
    );
  };

  // Component for rendering user (owner/principal/coordinator) with signed URL
  const UserItem = React.memo(({ item: userItem, isSelected, onSelect }) => {
    // Check if user is already a member
    const isAlreadyMember = isUserAlreadyMember(userItem.id);
    const isDisabled = isAlreadyMember;
    const showAsSelected = isAlreadyMember || isSelected;

    // Check cache first synchronously
    const cache = memberImageCacheRef.current;
    const cachedData = userItem.user_Image ? cache[userItem.user_Image] : null;
    const initialUrl = cachedData && cachedData.expiresAt > Date.now() 
      ? cachedData.signedUrl 
      : userItem.user_Image;
    
    const [userImageUrl, setUserImageUrl] = useState(initialUrl);

    // Get signed URL for user image (only if not in cache)
    useEffect(() => {
      if (userItem.user_Image) {
        // Check cache again (in case it was updated)
        const currentCache = memberImageCacheRef.current;
        const currentCachedData = currentCache[userItem.user_Image];
        if (currentCachedData && currentCachedData.expiresAt > Date.now()) {
          setUserImageUrl(currentCachedData.signedUrl);
          return;
        }
        
        getMemberImageSignedUrl(userItem.user_Image).then((signedUrl) => {
          if (signedUrl && signedUrl !== userItem.user_Image) {
            setUserImageUrl(signedUrl);
          }
        });
      } else {
        setUserImageUrl(null);
      }
    }, [userItem.user_Image]);

    return (
      <TouchableOpacity
        style={[
          styles.userItem, 
          showAsSelected && styles.userItemSelected,
          isDisabled && styles.userItemDisabled
        ]}
        onPress={isDisabled ? undefined : onSelect}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={styles.userAvatar}>
          {userImageUrl ? (
            <Image source={{ uri: userImageUrl }} style={styles.userAvatarImage} cachePolicy="disk" />
          ) : (
            <Text style={styles.userAvatarText}>
              {(userItem.full_Name || userItem.email || 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {userItem.full_Name || userItem.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.userEmail}>{userItem.email || ''}</Text>
          {isAlreadyMember && (
            <Text style={styles.alreadyMemberText}>Already a member</Text>
          )}
        </View>
        {showAsSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={hp(2.5)} 
            color={isDisabled ? "#6B7280" : "#1CACF3"} 
          />
        )}
      </TouchableOpacity>
    );
  });

  const renderUser = ({ item }) => {
    return (
      <UserItem
        item={item}
        isSelected={selectedUsers.includes(item.id)}
        onSelect={() => handleSelectUser(item.id)}
      />
    );
  };

  if (showManageMembers) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowManageMembers(false)} style={styles.closeButton}>
              <View style={styles.backIcon}>
                <View style={styles.arrowContainer}>
                  <RightArrow color="#111827" strokeWidth="2.5" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Members</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Role Selection */}
          <View style={styles.roleSelection}>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'owner' && styles.roleButtonSelected]}
              onPress={() => {
                setSelectedRole('owner');
                setSelectedTeachers([]);
                setSelectedUsers([]);
              }}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'owner' && styles.roleButtonTextSelected]}>
                Owner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'principal' && styles.roleButtonSelected]}
              onPress={() => {
                setSelectedRole('principal');
                setSelectedTeachers([]);
                setSelectedUsers([]);
              }}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'principal' && styles.roleButtonTextSelected]}>
                Principal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'coordinator' && styles.roleButtonSelected]}
              onPress={() => {
                setSelectedRole('coordinator');
                setSelectedTeachers([]);
                setSelectedUsers([]);
              }}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'coordinator' && styles.roleButtonTextSelected]}>
                Coordinator
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'teachers' && styles.roleButtonSelected]}
              onPress={() => {
                setSelectedRole('teachers');
                setSelectedUsers([]);
              }}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'teachers' && styles.roleButtonTextSelected]}>
                Teachers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Users/Teachers List */}
          {selectedRole === 'teachers' ? (
            <View style={styles.horizontalListContainer}>
              <FlatList
                data={teachersList}
                keyExtractor={(item) => String(item.auth_User_Id)}
                renderItem={renderTeacher}
                horizontal
                showsHorizontalScrollIndicator={false}
                onEndReached={() => {
                  if (hasMoreTeachers && !isLoadingTeachers) {
                    loadTeachers(teachersOffset);
                  }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isLoadingTeachers ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#1CACF3" />
                    </View>
                  ) : null
                }
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          ) : selectedRole && ['owner', 'principal', 'coordinator'].includes(selectedRole) ? (
            <View style={styles.listContainer}>
              <ScrollView style={styles.verticalList}>
                {isLoadingUsers ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1CACF3" />
                  </View>
                ) : (
                  usersList.map((user) => (
                    <UserItem
                      key={user.id}
                      item={user}
                      isSelected={selectedUsers.includes(user.id)}
                      onSelect={() => handleSelectUser(user.id)}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Select a role to add members</Text>
              </View>
            </View>
          )}

          {/* Add Selected Button */}
          {(selectedTeachers.length > 0 || selectedUsers.length > 0) && (
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addSelectedButton}
                onPress={handleAddSelectedMembers}
                disabled={isAddingMembers}
              >
                {isAddingMembers ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addSelectedButtonText}>
                    Add {selectedTeachers.length + selectedUsers.length} Member(s)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <View style={styles.backIcon}>
              <View style={styles.arrowContainer}>
                <RightArrow color="#111827" strokeWidth="2.5" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Group Image and Name */}
          <View style={styles.groupHeader}>
            <TouchableOpacity
              style={styles.groupImageContainer}
              onPress={() => canEdit && handlePickGroupImage()}
              disabled={!canEdit || isEditingImage}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              {groupImageUrl || chatImage ? (
                <Image source={{ uri: groupImageUrl || chatImage }} style={styles.groupImage} cachePolicy="disk" />
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
                    setIsEditingName(false);
                    setChatName(params.chatName || '');
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
                  >
                    <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Members Section */}
          <View style={styles.membersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              {canEdit && (
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => setShowManageMembers(true)}
                >
                  <Text style={styles.manageButtonText}>Manage Members</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoadingMembers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1CACF3" />
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => String(item.member_id)}
                renderItem={renderMember}
                scrollEnabled={false}
                onEndReached={loadMoreMembers}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#1CACF3" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default groupInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageText: {
    fontSize: hp(4),
    fontFamily: 'Poppins-Bold',
    color: '#6B7280',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: '#1CACF3',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  editNameButton: {
    padding: 4,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
    maxWidth: 200,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1CACF3',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  membersSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1CACF3',
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  memberAvatarText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#6B7280',
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
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  roleSelection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  roleButtonSelected: {
    backgroundColor: '#1CACF3',
  },
  roleButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  roleButtonTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  horizontalListContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  horizontalList: {
    paddingRight: 16,
  },
  verticalList: {
    flex: 1,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  teacherItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1CACF3',
  },
  teacherItemDisabled: {
    opacity: 0.6,
  },
  teacherAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherAvatarImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  teacherAvatarText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#6B7280',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  teacherEmail: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  userItemDisabled: {
    opacity: 0.6,
  },
  alreadyMemberText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  userAvatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  userAvatarText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addSelectedButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1CACF3',
    borderRadius: 8,
    alignItems: 'center',
  },
  addSelectedButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
});

