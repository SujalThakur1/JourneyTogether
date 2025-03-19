import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  touched?: boolean;
  label?: string;
  placeholder?: string;
}

const EmailInput = ({
  value,
  onChangeText,
  error,
  touched,
  label = "Email",
  placeholder = "Enter your email",
}: EmailInputProps) => {
  // Static color values (replace with your own theme logic if needed)
  const isDark = false; // Replace with your own dark mode detection logic
  const backgroundColor = isDark ? "#27272a" : "white";
  const primaryColor = isDark ? "white" : "black";
  const placeholderColor = "red"; // Note: Original code had red for both light/dark
  const textColor = isDark ? "white" : "black";
  const errorColor = "#ef4444";

  return (
    <View style={styles.container}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={touched && !!error}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        textColor={textColor}
        style={[
          styles.input,
          {
            backgroundColor,
          },
        ]}
        theme={{
          colors: {
            primary: primaryColor,
            placeholder: placeholderColor,
            text: "blue",
            error: errorColor,
          },
        }}
      />
      {touched && error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
});

export default EmailInput;
