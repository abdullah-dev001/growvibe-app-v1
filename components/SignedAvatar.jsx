import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hp } from '../helpers/common';
import useSignedProfileImage from '../hooks/useSignedProfileImage';

const SignedAvatar = ({
  imageUrl,
  size = hp(5),
  style,
  placeholderLabel = '',
  placeholderStyle,
  placeholderTextStyle,
  rounded = true,
}) => {
  const resolvedUrl = useSignedProfileImage(imageUrl);

  const baseStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: rounded ? size / 2 : styles.avatar.borderRadius,
    },
    style,
  ];

  if (resolvedUrl) {
    return (
      <Image
        source={{ uri: resolvedUrl }}
        cachePolicy="disk"
        contentFit="cover"
        style={baseStyle}
      />
    );
  }

  return (
    <View style={[baseStyle, styles.placeholder, placeholderStyle]}>
      {placeholderLabel ? (
        <Text style={[styles.placeholderText, placeholderTextStyle]}>
          {placeholderLabel.charAt(0).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: hp(2.5),
    backgroundColor: '#E5E7EB',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#6B7280',
    fontSize: hp(1.6),
  },
});

export default SignedAvatar;

