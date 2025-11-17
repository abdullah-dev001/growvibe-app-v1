import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { hp } from '../../helpers/common';

const MessageSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBar = ({ width, height, style, isRight = false }) => (
    <Animated.View
      style={[
        isRight ? styles.skeletonBarRight : styles.skeletonBar,
        {
          width,
          height,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );

  const AvatarSkeleton = () => (
    <Animated.View
      style={[
        styles.avatarSkeleton,
        {
          opacity: shimmerOpacity,
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Left-aligned message with avatar (other user) */}
      <View style={styles.messageContainerLeft}>
        <View style={styles.senderInfoSkeleton}>
          <AvatarSkeleton />
          <SkeletonBar width={60} height={hp(1.2)} />
        </View>
        <View style={[styles.messageBubble, styles.messageBubbleLeft]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} />
          <SkeletonBar width="85%" height={hp(1.6)} style={styles.messageLine} />
          <SkeletonBar width="60%" height={hp(1.6)} style={styles.messageLine} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={50} height={hp(1.1)} />
          </View>
        </View>
      </View>

      {/* Right-aligned message (current user) */}
      <View style={styles.messageContainerRight}>
        <View style={[styles.messageBubble, styles.messageBubbleRight]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <SkeletonBar width="75%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={45} height={hp(1.1)} isRight={true} />
          </View>
        </View>
      </View>

      {/* Left-aligned message (other user) */}
      <View style={styles.messageContainerLeft}>
        <View style={styles.senderInfoSkeleton}>
          <AvatarSkeleton />
          <SkeletonBar width={70} height={hp(1.2)} />
        </View>
        <View style={[styles.messageBubble, styles.messageBubbleLeft]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} />
          <SkeletonBar width="90%" height={hp(1.6)} style={styles.messageLine} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={50} height={hp(1.1)} />
          </View>
        </View>
      </View>

      {/* Right-aligned message (current user) */}
      <View style={styles.messageContainerRight}>
        <View style={[styles.messageBubble, styles.messageBubbleRight]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <SkeletonBar width="65%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <SkeletonBar width="50%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={45} height={hp(1.1)} isRight={true} />
          </View>
        </View>
      </View>

      {/* Left-aligned message (other user) */}
      <View style={styles.messageContainerLeft}>
        <View style={styles.senderInfoSkeleton}>
          <AvatarSkeleton />
          <SkeletonBar width={55} height={hp(1.2)} />
        </View>
        <View style={[styles.messageBubble, styles.messageBubbleLeft]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} />
          <SkeletonBar width="80%" height={hp(1.6)} style={styles.messageLine} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={50} height={hp(1.1)} />
          </View>
        </View>
      </View>

      {/* Right-aligned message (current user) */}
      <View style={styles.messageContainerRight}>
        <View style={[styles.messageBubble, styles.messageBubbleRight]}>
          <SkeletonBar width="100%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <SkeletonBar width="70%" height={hp(1.6)} style={styles.messageLine} isRight={true} />
          <View style={styles.timestampContainer}>
            <SkeletonBar width={45} height={hp(1.1)} isRight={true} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default MessageSkeleton;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
    maxWidth: '75%',
    marginBottom: 12,
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    marginBottom: 12,
  },
  senderInfoSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  avatarSkeleton: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#1CACF3',
    borderBottomRightRadius: 4,
  },
  skeletonBar: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonBarRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  messageLine: {
    marginBottom: 6,
  },
  timestampContainer: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
});

