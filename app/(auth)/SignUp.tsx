// import React, { useState } from "react";
// import { StyleSheet } from "react-native";
// import { supabase } from "../../lib/supabase";
// import {
//   Box,
//   Text,
//   VStack,
//   Button,
//   Center,
//   Heading,
//   useColorMode,
//   useColorModeValue,
// } from "native-base";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { Formik } from "formik";
// import * as Yup from "yup";
// import EmailInput from "../../components/EmailInput";
// import PasswordInput from "../../components/PasswordInput";
// import { useRouter } from "expo-router";

// const SignUpSchema = Yup.object().shape({
//   email: Yup.string()
//     .email("Please enter a valid email address")
//     .required("Email is required"),
//   password: Yup.string()
//     .min(6, "Password must be at least 6 characters")
//     .required("Password is required"),
//   confirmPassword: Yup.string()
//     .oneOf([Yup.ref("password")], "Passwords must match")
//     .required("Please confirm your password"),
// });

// export default function SignUp() {
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const { colorMode } = useColorMode();
//   const isDark = colorMode === "dark";
//   const bgColor = useColorModeValue("gray.100", "gray.900");
//   const textColor = useColorModeValue("gray.800", "gray.100");
//   const inputBgColor = useColorModeValue("gray.50", "gray.800");

//   const handleSignUp = async (values: any, { setErrors }: any) => {
//     setLoading(true);
//     try {
//       console.log("Starting signup process...");
//       const { data: authData, error: authError } = await supabase.auth.signUp({
//         email: values.email,
//         password: values.password,
//       });

//       if (authError) {
//         console.error("Auth error:", authError);
//         setErrors({ email: authError.message });
//         return;
//       }

//       if (authData && authData.user) {
//         console.log("Auth successful, creating profile...");
//         const newUser = {
//           id: authData.user.id,
//           email: values.email,
//           created_at: new Date().toISOString(),
//         };
//         console.log("Attempting to insert user:", newUser);

//         try {
//           const { data: profileData, error: profileError } = await supabase
//             .from("users")
//             .insert(newUser)
//             .select()
//             .single();

//           // Log the raw response
//           console.log("Database response:", { profileData, profileError });

//           if (profileError || !profileData) {
//             const errorMessage = profileError
//               ? Object.keys(profileError).length === 0
//                 ? "Permission denied - check RLS policies"
//                 : profileError.message
//               : "No data returned from database";

//             console.error("Profile creation failed:", errorMessage);
//             setErrors({ email: `Failed to create profile: ${errorMessage}` });

//             // Clean up the auth account since profile creation failed
//             const { error: signOutError } = await supabase.auth.signOut();
//             if (signOutError) {
//               console.error("Error signing out:", signOutError);
//             }
//             return;
//           }

//           console.log("Profile created successfully:", profileData);
//           router.push("/(onboarding)/Account");
//         } catch (dbError) {
//           console.error("Database operation error:", dbError);
//           setErrors({
//             email: `Database error: ${
//               dbError instanceof Error ? dbError.message : "Unknown error"
//             }`,
//           });
//           await supabase.auth.signOut();
//           return;
//         }
//       }
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "An unexpected error occurred";
//       console.error("Signup error:", error);
//       setErrors({ email: errorMessage });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAwareScrollView
//       contentContainerStyle={styles.container}
//       enableOnAndroid={true}
//       keyboardShouldPersistTaps="handled"
//     >
//       <Box flex={1} bg={bgColor} safeArea>
//         <Box flex={1} px={6} py={10}>
//           <Center flex={1}>
//             <VStack space={8} width="100%" maxW="400px">
//               <Center>
//                 <Heading size="2xl" color={textColor} fontWeight="bold">
//                   Create Account
//                 </Heading>
//                 <Text color={textColor} mt={2} fontSize="md">
//                   Sign up to start your journey
//                 </Text>
//               </Center>

//               <Formik
//                 initialValues={{ email: "", password: "", confirmPassword: "" }}
//                 validationSchema={SignUpSchema}
//                 onSubmit={handleSignUp}
//               >
//                 {({ handleChange, handleSubmit, values, errors, touched }) => (
//                   <Box bg={inputBgColor} rounded="xl" p={6} shadow={2}>
//                     <VStack space={4}>
//                       <EmailInput
//                         value={values.email}
//                         onChangeText={handleChange("email")}
//                         error={errors.email}
//                         touched={touched.email}
//                       />

//                       <PasswordInput
//                         value={values.password}
//                         onChangeText={handleChange("password")}
//                         error={errors.password}
//                         touched={touched.password}
//                         label="Password"
//                       />

//                       <PasswordInput
//                         value={values.confirmPassword}
//                         onChangeText={handleChange("confirmPassword")}
//                         error={errors.confirmPassword}
//                         touched={touched.confirmPassword}
//                         label="Confirm Password"
//                         placeholder="Confirm your password"
//                       />

//                       <Button
//                         onPress={() => handleSubmit()}
//                         isLoading={loading}
//                         bg={isDark ? "white" : "black"}
//                         _text={{
//                           color: isDark ? "black" : "white",
//                         }}
//                       >
//                         Sign up
//                       </Button>
//                     </VStack>
//                   </Box>
//                 )}
//               </Formik>

//               <Center>
//                 <Text color={textColor} fontSize="md">
//                   Already have an account?
//                 </Text>
//                 <Button
//                   variant="ghost"
//                   onPress={() => router.push("/(auth)/SignIn")}
//                   isDisabled={loading}
//                   mt={2}
//                   _text={{
//                     color: textColor,
//                     fontSize: "md",
//                     fontWeight: "bold",
//                   }}
//                 >
//                   Sign in to your account
//                 </Button>
//               </Center>
//             </VStack>
//           </Center>
//         </Box>
//       </Box>
//     </KeyboardAwareScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//   },
// });
