import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hp } from '../../../helpers/common';

const chat = () => {
  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSubtitle}>Messages and conversations</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.placeholderText}>Chat feature coming soon...</Text>
        </View>
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
    paddingVertical: 16,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholderText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});

