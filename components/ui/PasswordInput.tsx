import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  touched?: boolean;
  label?: string;
  placeholder?: string;
}

const PasswordInput = ({
  value,
  onChangeText,
  error,
  touched,
  label = "Password",
  placeholder = "Enter your password",
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  // Simple dark mode detection (you might want to implement your own logic)
  const isDark = false; // Replace with your own dark mode detection logic

  return (
    <View style={styles.container}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={touched && !!error}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        mode="outlined"
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#27272a" : "white",
          },
        ]}
        textColor={isDark ? "white" : "black"}
        theme={{
          colors: {
            primary: isDark ? "white" : "black",
            placeholder: isDark ? "#9CA3AF" : "#6B7280",
            error: "#ef4444",
          },
        }}
        right={
          <PaperTextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
            color={isDark ? "white" : "black"}
          />
        }
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

export default PasswordInput;
