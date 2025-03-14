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
// import { useApp } from "../../contexts/AppContext";

// const SignInSchema = Yup.object().shape({
//   email: Yup.string()
//     .email("Please enter a valid email address")
//     .required("Email is required"),
//   password: Yup.string()
//     .min(6, "Password must be at least 6 characters")
//     .required("Password is required"),
// });

// export default function SignIn() {
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const { setUserUpdated } = useApp();
//   const { colorMode } = useColorMode();
//   const isDark = colorMode === "dark";
//   const bgColor = useColorModeValue("gray.100", "gray.900");
//   const textColor = useColorModeValue("gray.800", "gray.100");
//   const inputBgColor = useColorModeValue("gray.50", "gray.800");

//   const handleSignIn = async (values: any, { setErrors }: any) => {
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email: values.email,
//         password: values.password,
//       });

//       if (error) {
//         if (error.message.includes("Invalid login credentials")) {
//           setErrors({
//             email: "Invalid email or password",
//             password: "Invalid email or password",
//           });
//         } else {
//           setErrors({
//             email: error.message,
//           });
//         }
//       } else {
//         setUserUpdated(true);
//       }
//     } catch (error) {
//       console.error("Error during sign in:", error);
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
//                   Welcome Back
//                 </Heading>
//                 <Text color={textColor} mt={2} fontSize="md">
//                   Sign in to continue your journey
//                 </Text>
//               </Center>

//               <Formik
//                 initialValues={{ email: "", password: "" }}
//                 validationSchema={SignInSchema}
//                 onSubmit={handleSignIn}
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
//                       />

//                       <Button
//                         onPress={() => handleSubmit()}
//                         isLoading={loading}
//                         bg={isDark ? "white" : "black"}
//                         _text={{
//                           color: isDark ? "black" : "white",
//                         }}
//                       >
//                         Sign in
//                       </Button>
//                     </VStack>
//                   </Box>
//                 )}
//               </Formik>

//               <Center>
//                 <Text color={textColor} fontSize="md">
//                   Don't have an account?
//                 </Text>
//                 <Button
//                   variant="ghost"
//                   onPress={() => router.push("/(auth)/SignUp")}
//                   isDisabled={loading}
//                   mt={2}
//                   _text={{
//                     color: textColor,
//                     fontSize: "md",
//                     fontWeight: "bold",
//                   }}
//                 >
//                   Journey Together with us
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
