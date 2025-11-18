import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { hp } from "../helpers/common";

const Button = ({
  title,
  onPress,
  icon,
  bgColor = "#1CACF3",
  textColor = "#FFFFFF",
  disabled = false,
  loading = false,
  size = "medium",
  variant = "filled",
  iconPosition = "left",
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: hp(1.3),
          paddingHorizontal: hp(2),
          fontSize: hp(1.8),
          borderRadius: hp(40),
        };
      case "large":
        return {
          paddingVertical: hp(2.5),
          paddingHorizontal: hp(6),
          fontSize: hp(2.2),
          borderRadius: hp(40),
        };
      case "medium":
      default:
        return {
          paddingVertical: hp(2),
          paddingHorizontal: hp(4),
          fontSize: hp(1.8),
          borderRadius: hp(40),
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: bgColor,
        };
      case "text":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      case "filled":
      default:
        return {
          backgroundColor: bgColor,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    if (variant === "outlined" || variant === "text") {
      return bgColor;
    }
    return textColor;
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const finalTextColor = getTextColor();
  const isDisabled = disabled || loading;

  const { style, ...restProps } = props;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.buttonBase,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          opacity: isDisabled ? 0.6 : 1,
        },
        variantStyles,
        style,
      ]}
      android_ripple={{ color: "#ccc" }}
      {...restProps}
    >
      {/* Left Icon */}
      {icon && iconPosition === "left" && !loading && (
        <View style={styles.leftIcon}>{icon}</View>
      )}

      {/* Loading Spinner */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={finalTextColor}
          style={styles.leftIcon}
        />
      )}

      {/* Button Text */}
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          fontFamily: "Poppins-SemiBold",
          color: finalTextColor,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        {title}
      </Text>

      {/* Right Icon */}
      {icon && iconPosition === "right" && !loading && (
        <View style={styles.rightIcon}>{icon}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
