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
import EmailInput from "../../components/EmailInput";
import PasswordInput from "../../components/PasswordInput";
import { useRouter } from "expo-router";
import { requestLocationPermission } from "../../lib/locationService";

const SignUpSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isDark = false; // Replace with your own dark mode detection logic
  const bgColor = isDark ? "#1F2937" : "#F3F4F6"; // gray.900 : gray.100
  const textColor = isDark ? "#F3F4F6" : "#1F2937"; // gray.100 : gray.800
  const inputBgColor = isDark ? "#1F2937" : "#F9FAFB"; // gray.800 : gray.50

  const handleSignUp = async (values: any, { setErrors }: any) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        setErrors({ email: authError.message });
        return;
      }

      if (authData && authData.user) {
        const newUser = {
          id: authData.user.id,
          email: values.email,
          created_at: new Date().toISOString(),
        };

        try {
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .insert(newUser)
            .select()
            .single();

          if (profileError || !profileData) {
            const errorMessage = profileError
              ? profileError.message
              : "No data returned from database";
            console.error("Profile creation failed:", errorMessage);
            setErrors({ email: `Failed to create profile: ${errorMessage}` });
            await supabase.auth.signOut();
            return;
          }

          // Request location permission after successful sign-up
          requestLocationPermission();

          router.push("/(onboarding)/Account");
        } catch (dbError: any) {
          console.error("Database operation error:", dbError);
          setErrors({ email: `Database error: ${dbError.message}` });
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Signup error:", error);
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
                  Create Account
                </Text>
                <Text style={[styles.subheading, { color: textColor }]}>
                  Sign up to start your journey
                </Text>
              </View>

              <Formik
                initialValues={{ email: "", password: "", confirmPassword: "" }}
                validationSchema={SignUpSchema}
                onSubmit={handleSignUp}
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

                      <PasswordInput
                        value={values.confirmPassword}
                        onChangeText={handleChange("confirmPassword")}
                        error={errors.confirmPassword}
                        touched={touched.confirmPassword}
                        label="Confirm Password"
                        placeholder="Confirm your password"
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
                            Sign up
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </Formik>

              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: textColor }]}>
                  Already have an account?
                </Text>
                <Pressable
                  onPress={() => router.push("/(auth)/SignIn")}
                  disabled={loading}
                  style={styles.linkButton}
                >
                  <Text style={[styles.linkText, { color: textColor }]}>
                    Sign in to your account
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
