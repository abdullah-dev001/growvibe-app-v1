import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hp } from '../../../helpers/common';

// Mock data for personal chats - will be replaced with actual API data later
const MOCK_PERSONAL_CHATS = [
  {
    id: '1',
    personName: 'John Doe',
    personImage: null,
    lastMessage: 'Hey, how are you doing?',
    lastMessageTime: '2:30 PM',
    unreadCount: 3,
    type: 'personal',
  },
  {
    id: '2',
    personName: 'Jane Smith',
    personImage: null,
    lastMessage: 'Thanks for the update!',
    lastMessageTime: '1:15 PM',
    unreadCount: 0,
    type: 'personal',
  },
  {
    id: '3',
    personName: 'Mike Johnson',
    personImage: null,
    lastMessage: 'See you tomorrow',
    lastMessageTime: '12:00 PM',
    unreadCount: 1,
    type: 'personal',
  },
  {
    id: '4',
    personName: 'Sarah Williams',
    personImage: null,
    lastMessage: 'Can we schedule a meeting?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    type: 'personal',
  },
];

// Mock data for groups - will be replaced with actual API data later
const MOCK_GROUPS = [
  {
    id: 'g1',
    groupName: 'Class 10-A',
    groupImage: null,
    lastMessage: 'Assignment due tomorrow',
    lastMessageTime: '3:45 PM',
    unreadCount: 5,
    type: 'group',
    memberCount: 25,
  },
  {
    id: 'g2',
    groupName: 'Teachers Group',
    groupImage: null,
    lastMessage: 'Meeting at 4 PM',
    lastMessageTime: '2:20 PM',
    unreadCount: 0,
    type: 'group',
    memberCount: 12,
  },
  {
    id: 'g3',
    groupName: 'Science Club',
    groupImage: null,
    lastMessage: 'Lab session cancelled',
    lastMessageTime: '11:30 AM',
    unreadCount: 2,
    type: 'group',
    memberCount: 18,
  },
];

const chat = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('personal');
  const [personalChats] = useState(MOCK_PERSONAL_CHATS);
  const [groups] = useState(MOCK_GROUPS);

  const renderTabSwitcher = () => {
    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('personal')}
            style={[
              styles.tabButton,
              activeTab === 'personal' ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === 'personal' ? '#1CACF3' : '#6B7280' },
              ]}
            >
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('group')}
            style={[
              styles.tabButton,
              activeTab === 'group' ? styles.tabButtonActive : styles.tabButtonInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === 'group' ? '#1CACF3' : '#6B7280' },
              ]}
            >
              Group
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPersonalChatItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/screens/chatDetail',
            params: {
              chatId: item.id,
              chatName: item.personName,
              chatImage: item.personImage || '',
              chatType: item.type || 'personal',
            },
          });
        }}
      >
        {/* Person Image */}
        <View style={styles.avatarContainer}>
          {item.personImage ? (
            <Image
              source={{ uri: item.personImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.personName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.personName} numberOfLines={1}>
              {item.personName}
            </Text>
            <Text style={styles.lastMessageTime}>
              {item.lastMessageTime}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPersonalChatList = () => {
    return (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Chats</Text>
          <View style={styles.listDivider} />
        </View>
        <FlatList
          data={personalChats}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonalChatItem}
          contentContainerStyle={styles.scrollContent}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No chats yet. Start a conversation!
              </Text>
            </View>
          }
        />
      </>
    );
  };

  const renderGroupItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/screens/chatDetail',
            params: {
              chatId: item.id,
              chatName: item.groupName,
              chatImage: item.groupImage || '',
              chatType: item.type || 'group',
              memberCount: item.memberCount || 0,
            },
          });
        }}
      >
        {/* Group Image */}
        <View style={styles.avatarContainer}>
          {item.groupImage ? (
            <Image
              source={{ uri: item.groupImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.groupName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Group Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.personName} numberOfLines={1}>
              {item.groupName}
            </Text>
            <Text style={styles.lastMessageTime}>
              {item.lastMessageTime}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupChatList = () => {
    return (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Groups</Text>
          <View style={styles.listDivider} />
        </View>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.scrollContent}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
          <Text style={styles.headerSubtitle}>Messages and conversations</Text>
        </View>

        {/* Tab Switcher */}
        {renderTabSwitcher()}

        {/* Content based on active tab */}
        {activeTab === 'personal' ? renderPersonalChatList() : renderGroupChatList()}
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
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginTop: hp(1),
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-SemiBold',
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
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    fontSize: hp(1.7),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    flex: 1,
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
  lastMessage: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
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
});

