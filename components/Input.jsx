import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Eye from "../assets/icons/Eye";
import EyeOff from "../assets/icons/EyeOff";
import { hp } from "../helpers/common";

const Input = ({
  label,
  type = "text",
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case "email":
        return "email-address";
      case "number":
        return "numeric";
      default:
        return "default";
    }
  };

  const getAutoCapitalize = () => {
    switch (type) {
      case "email":
      case "password":
        return "none";
      default:
        return "sentences";
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isPasswordType = type === "password";
  const showPassword = isPasswordType && isPasswordVisible;
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: hp(1.6) },
            { color: hasError ? "#EF4444" : "#374151" },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: hasError ? "#EF4444" : "#D1D5DB",
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          style={[
            styles.textInput,
            { fontSize: hp(1.6), lineHeight: hp(2.4) },
            inputStyle,
          ]}
          keyboardType={getKeyboardType()}
          autoCapitalize={getAutoCapitalize()}
          autoCorrect={type !== "email" && type !== "password"}
          secureTextEntry={isPasswordType && !showPassword}
          placeholderTextColor="#9CA3AF"
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        <View style={styles.rightIcon}>
          {isPasswordType ? (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              {isPasswordVisible ? (
                <EyeOff color="#D1D5DB" size={hp(0.4)} strokeWidth={1} />
              ) : (
                <Eye color="#D1D5DB" size={hp(0.4)} strokeWidth={1} />
              )}
            </TouchableOpacity>
          ) : (
            rightIcon && <View style={styles.iconButton}>{rightIcon}</View>
          )}
        </View>
      </View>

      {/* Error Message */}
      {hasError && (
        <Text style={[styles.errorText, { fontSize: hp(1.4) }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(0.5),
  },
  label: {
    fontFamily: "Poppins-Medium",
    fontWeight: "500",
    marginBottom: hp(1),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: hp(1.2),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    minHeight: hp(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftIcon: {
    marginRight: hp(1),
  },
  textInput: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    color: "#111827",
    paddingVertical: 0,
    paddingTop: hp(0.5),
    paddingHorizontal: 0,
  },
  rightIcon: {
    marginLeft: hp(1),
  },
  iconButton: {
    // padding: hp(0.5),
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "Poppins-Regular",
    color: "#EF4444",
    fontWeight: "400",
    marginTop: hp(0.2),
    marginLeft: hp(0.5),
  },
});

export default Input;
