import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RightArrow from '../../assets/icons/RightArrow';
import { hp } from '../../helpers/common';

const ChatHeader = ({ chatName, chatImage, chatType, memberCount, onBack, onGroupInfoPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <View style={styles.backIcon}>
          <View style={styles.arrowContainer}>
            <RightArrow color="#111827" strokeWidth="2.5" className="" />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.headerInfo} 
        activeOpacity={0.7}
        onPress={chatType === 'group' && onGroupInfoPress ? onGroupInfoPress : undefined}
      >
        <View style={styles.headerAvatar}>
          {chatImage ? (
            <Image source={{ uri: chatImage }} style={styles.avatar} cachePolicy="disk" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {chatName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerName} numberOfLines={1}>
            {chatName}
          </Text>
          {chatType === 'group' ? (
            <Text style={styles.headerStatus}>
              {memberCount} members
            </Text>
          ) : (
            <Text style={styles.headerStatus}>Online</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  arrowContainer: {
    transform: [{ rotate: '180deg' }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ChatHeader;

