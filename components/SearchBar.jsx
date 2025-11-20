import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Search from "../assets/icons/Search";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  style,
  ...props
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconLeft}>
        <Search size={18} color="gray" strokeWidth={1.6} />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        style={styles.input}
        {...props}
      />

      {value ? (
        <Pressable onPress={() => onChangeText("")} style={styles.clearButton}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Tailwind gray-200
    elevation: 3,
    shadowColor: "#1CACF3",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#374151", // gray-700
    fontFamily: "Poppins-Regular",
    minHeight: 40,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearText: {
    fontSize: 18,
    color: "#A0AEC0",
    fontFamily: "Poppins-Regular",
  },
});
