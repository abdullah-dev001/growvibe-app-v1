import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hp } from '../../helpers/common';
import { supabase } from '../../supabaseClient';

const VoiceMessage = ({ 
  messageId, 
  duration, 
  isMe, 
  playingVoiceId, 
  voiceData, 
  setVoiceData,
  voiceProgress,
  handlePlayVoice,
  isPending = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const animatedValues = useRef(
    [1, 2, 3, 4, 5].map(() => new Animated.Value(10))
  ).current;
  const animationRef = useRef(null);
  
  const formatVoiceDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(parseInt(seconds) / 60);
    const secs = parseInt(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaying = playingVoiceId === messageId;
  const progress = voiceProgress[messageId];
  const currentTime = progress?.currentTime || 0;
  const totalDuration = progress?.duration || duration || 0;
  
  // Animate waveform bars only when playing
  useEffect(() => {
    if (isPlaying && progress?.isPlaying) {
      // Start smooth animation
      const animations = animatedValues.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 15 + 15, // Random height between 15-30
              duration: 300 + Math.random() * 200, // Random duration between 300-500ms
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 10,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        );
      });
      
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    } else {
      // Stop animation and reset to base height
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      animatedValues.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 10,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isPlaying, progress?.isPlaying]);

  const handlePlayPress = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      // Use pre-fetched voice data if available
      const voiceInfo = voiceData[messageId];
      
      if (voiceInfo?.url) {
        await handlePlayVoice(messageId, voiceInfo.url);
      } else {
        // Fallback: fetch voice URL from message table
        try {
          const { data, error } = await supabase
            .from("message")
            .select("voice_Url, content")
            .eq("id", messageId)
            .maybeSingle();
          
          if (error) {
            console.error('Voice fetch error:', error);
            Alert.alert('Error', `Failed to fetch voice message: ${error.message || 'Unknown error'}`);
            return;
          }
          
          // Check for voice_Url field or use content if it contains the URL
          const voiceUrl = data?.voice_Url || data?.content;
          if (voiceUrl) {
            // Cache it for future use
            setVoiceData((prev) => ({
              ...prev,
              [messageId]: { url: voiceUrl, duration: null },
            }));
            await handlePlayVoice(messageId, voiceUrl);
          } else {
            Alert.alert('Error', 'Voice message not found');
          }
        } catch (err) {
          console.error('Voice fetch error:', err);
          Alert.alert('Error', `Failed to fetch voice: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Voice play error:', err);
      Alert.alert('Error', `Failed to play voice: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Colors based on whether it's user's message or opponent's
  const playButtonBg = isMe ? 'rgba(255, 255, 255, 0.2)' : 'rgba(28, 172, 243, 0.15)';
  const iconColor = isMe ? '#FFFFFF' : '#1CACF3';
  const waveformColor = isMe ? '#FFFFFF' : '#1CACF3';
  const durationColor = isMe ? '#FFFFFF' : '#111827';
  const separatorColor = isMe ? '#FFFFFF' : '#6B7280';

  // Show loading state for pending messages
  if (isPending) {
    return (
      <View style={styles.voiceMessageContainer}>
        <View style={[styles.voicePlayButton, { backgroundColor: playButtonBg }]}>
          <ActivityIndicator size="small" color={iconColor} />
        </View>
        <View style={styles.voiceMessageInfo}>
          <Text style={[styles.voiceDuration, { color: durationColor, opacity: 0.7 }]}>
            Sending voice message...
          </Text>
          {duration && (
            <Text style={[styles.voiceDuration, { color: durationColor, opacity: 0.7, fontSize: hp(1.2) }]}>
              {formatVoiceDuration(duration)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.voiceMessageContainer}>
      <TouchableOpacity
        style={[styles.voicePlayButton, { backgroundColor: playButtonBg }]}
        activeOpacity={0.7}
        onPress={handlePlayPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={hp(2)}
            color={iconColor}
            style={styles.voicePlayIcon}
          />
        )}
      </TouchableOpacity>
      <View style={styles.voiceMessageInfo}>
        <View style={styles.voiceWaveform}>
          {animatedValues.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.voiceWaveformBar,
                { 
                  height: anim,
                  backgroundColor: waveformColor,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.voiceDurationContainer}>
          <Text style={[styles.voiceDuration, { color: durationColor }]}>
            {isPlaying && progress ? formatVoiceDuration(currentTime) : formatVoiceDuration(totalDuration)}
          </Text>
          {isPlaying && progress && totalDuration > 0 && (
            <Text style={[styles.voiceDurationSeparator, { color: separatorColor }]}>
              {' / '}
            </Text>
          )}
          {isPlaying && progress && totalDuration > 0 && (
            <Text style={[styles.voiceDuration, { color: durationColor }]}>
              {formatVoiceDuration(totalDuration)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voicePlayIcon: {
    marginLeft: 2,
  },
  voiceMessageInfo: {
    flex: 1,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 30,
    marginBottom: 4,
    gap: 3,
  },
  voiceWaveformBar: {
    width: 3,
    opacity: 0.6,
    borderRadius: 1.5,
    minHeight: 10,
  },
  voiceDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceDuration: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    opacity: 0.8,
  },
  voiceDurationSeparator: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    opacity: 0.6,
  },
});

export default VoiceMessage;

