import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Formik } from "formik";
import * as Yup from "yup";
import EmailInput from "../../components/ui/EmailInput";
import PasswordInput from "../../components/ui/PasswordInput";
import { useRouter } from "expo-router";
import { useApp } from "../../contexts/AppContext";
import { requestLocationPermission } from "../../lib/locationService";

const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUserUpdated } = useApp();
  const isDark = false; // Replace with your own dark mode detection logic
  const bgColor = isDark ? "#1F2937" : "#F3F4F6"; // gray.900 : gray.100
  const textColor = isDark ? "#F3F4F6" : "#1F2937"; // gray.100 : gray.800
  const inputBgColor = isDark ? "#1F2937" : "#F9FAFB"; // gray.800 : gray.50

  const handleSignIn = async (values: any, { setErrors }: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            email: "Invalid email or password",
            password: "Invalid email or password",
          });
        } else {
          setErrors({ email: error.message });
        }
        return;
      }

      // Request location permission after successful sign-in
      requestLocationPermission();

      // Update user state
      setUserUpdated(true);

      // Navigate to the main app
      router.replace("/(tabs)");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Sign-in error:", error);
      setErrors({ email: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
        <View style={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={[styles.heading, { color: textColor }]}>
                  Welcome Back
                </Text>
                <Text style={[styles.subheading, { color: textColor }]}>
                  Sign in to continue your journey
                </Text>
              </View>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={SignInSchema}
                onSubmit={handleSignIn}
              >
                {({ handleChange, handleSubmit, values, errors, touched }) => (
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: inputBgColor },
                    ]}
                  >
                    <View style={styles.inputWrapper}>
                      <EmailInput
                        value={values.email}
                        onChangeText={handleChange("email")}
                        error={errors.email}
                        touched={touched.email}
                      />

                      <PasswordInput
                        value={values.password}
                        onChangeText={handleChange("password")}
                        error={errors.password}
                        touched={touched.password}
                      />

                      <Pressable
                        onPress={() => handleSubmit()}
                        disabled={loading}
                        style={[
                          styles.button,
                          { backgroundColor: isDark ? "white" : "black" },
                        ]}
                      >
                        {loading ? (
                          <ActivityIndicator
                            color={isDark ? "black" : "white"}
                            size="small"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.buttonText,
                              { color: isDark ? "black" : "white" },
                            ]}
                          >
                            Sign in
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </Formik>

              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: textColor }]}>
                  Don't have an account?
                </Text>
                <Pressable
                  onPress={() => router.push("/(auth)/SignUp")}
                  disabled={loading}
                  style={styles.linkButton}
                >
                  <Text style={[styles.linkText, { color: textColor }]}>
                    Journey Together with us
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    gap: 32,
  },
  headerContainer: {
    alignItems: "center",
    gap: 8,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subheading: {
    fontSize: 16,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  inputWrapper: {
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footerContainer: {
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 16,
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
