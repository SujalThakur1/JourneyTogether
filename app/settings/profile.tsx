import React, { useState } from "react";
import { Platform } from "react-native";
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Heading,
  FormControl,
  Icon,
  Center,
  Pressable,
  StatusBar,
  useToast,
} from "native-base";
import { useApp } from "../../contexts/AppContext";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "../../components/Avatar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput as PaperTextInput } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

export default function ProfileSettings() {
  const router = useRouter();
  const toast = useToast();
  const { userDetails, setUserUpdated } = useApp();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    username: userDetails?.username || "",
    email: userDetails?.email || "",
    date_of_birth: userDetails?.date_of_birth || "",
    gender: userDetails?.gender || "",
    bio: userDetails?.bio || "",
    avatar_url: userDetails?.avatar_url || "",
  });

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.900");
  const cardBgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("black", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("#ED851B", "#ED851B");
  const inputBgColor = useColorModeValue("white", "gray.800");
  const isDark = useColorModeValue(false, true);
  const primaryColor = useColorModeValue("#000000", "#FFFFFF");
  const labelColor = useColorModeValue("#000000", "#FFFFFF");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date_of_birth: formatDate(selectedDate),
      }));
    }
  };

  const handleAvatarUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("users")
        .update({
          username: formData.username,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        })
        .eq("id", userDetails.id);

      if (error) throw error;

      setUserUpdated(true);

      toast.show({
        description: "Profile updated successfully",
        placement: "top",
        duration: 3000,
        backgroundColor: accentColor,
      });

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.show({
        description: "Failed to update profile",
        placement: "top",
        duration: 3000,
        backgroundColor: "red.500",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1A1A1A" : "#F7F5F2"}
      />

      <Box
        pl={5}
        pr={5}
        pt={2}
        pb={2}
        flexDirection="row"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor={borderColor}
      >
        <Pressable onPress={() => router.back()} mr={3}>
          <Icon as={Ionicons} name="arrow-back" size="md" color={textColor} />
        </Pressable>
        <Heading size="lg" color={textColor}>
          Profile Settings
        </Heading>
      </Box>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box p={5} flex={1}>
          <VStack space={6}>
            {/* Avatar Section */}
            <Center>
              <Avatar
                url={formData.avatar_url}
                size={120}
                onUpload={handleAvatarUpload}
              />
            </Center>

            {/* Profile Form */}
            <Box
              bg={cardBgColor}
              rounded="xl"
              borderWidth={1}
              borderColor={borderColor}
              shadow={1}
              p={5}
            >
              <VStack space={4}>
                {/* Username */}
                <FormControl>
                  <FormControl.Label _text={{ color: labelColor }}>
                    Username
                  </FormControl.Label>
                  <PaperTextInput
                    value={formData.username}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, username: value }))
                    }
                    mode="outlined"
                    style={{ backgroundColor: "transparent" }}
                    textColor={textColor}
                    theme={{
                      colors: {
                        primary: isDark ? "white" : "black",
                        placeholder: isDark ? "gray.400" : "gray.500",
                      },
                    }}
                  />
                </FormControl>

                {/* Email - Read Only */}
                <FormControl>
                  <FormControl.Label _text={{ color: labelColor }}>
                    Email
                  </FormControl.Label>
                  <PaperTextInput
                    value={formData.email}
                    mode="outlined"
                    style={{ backgroundColor: "transparent" }}
                    textColor={textColor}
                    disabled
                    theme={{
                      colors: {
                        primary: isDark ? "white" : "black",
                        placeholder: isDark ? "gray.400" : "gray.500",
                      },
                    }}
                  />
                  <FormControl.HelperText>
                    Email cannot be changed
                  </FormControl.HelperText>
                </FormControl>

                {/* Date of Birth */}
                <FormControl>
                  <FormControl.Label _text={{ color: labelColor }}>
                    Date of Birth
                  </FormControl.Label>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <PaperTextInput
                      value={formData.date_of_birth}
                      mode="outlined"
                      style={{ backgroundColor: "transparent" }}
                      textColor={textColor}
                      editable={false}
                      right={
                        <PaperTextInput.Icon
                          icon="calendar"
                          color={isDark ? "white" : "black"}
                          onPress={() => setShowDatePicker(true)}
                        />
                      }
                      theme={{
                        colors: {
                          primary: isDark ? "white" : "black",
                          placeholder: isDark ? "gray.400" : "gray.500",
                        },
                      }}
                    />
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        formData.date_of_birth
                          ? new Date(formData.date_of_birth)
                          : new Date()
                      }
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleDateChange}
                    />
                  )}
                </FormControl>

                {/* Gender */}
                <FormControl>
                  <FormControl.Label _text={{ color: labelColor }}>
                    Gender
                  </FormControl.Label>
                  <HStack space={4} mt={1}>
                    <Pressable
                      flex={1}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, gender: "male" }))
                      }
                    >
                      <Box
                        bg={
                          formData.gender === "male"
                            ? accentColor
                            : useColorModeValue("#F0EDE8", "#333333")
                        }
                        p={3}
                        rounded="lg"
                        alignItems="center"
                        opacity={formData.gender === "male" ? 1 : 0.7}
                      >
                        <Icon
                          as={Ionicons}
                          name="male-outline"
                          size="md"
                          color={
                            formData.gender === "male" ? "white" : textColor
                          }
                        />
                        <Text
                          color={
                            formData.gender === "male" ? "white" : textColor
                          }
                          mt={1}
                          fontSize="xs"
                          fontWeight={
                            formData.gender === "male" ? "bold" : "normal"
                          }
                        >
                          Male
                        </Text>
                      </Box>
                    </Pressable>
                    <Pressable
                      flex={1}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, gender: "female" }))
                      }
                    >
                      <Box
                        bg={
                          formData.gender === "female"
                            ? accentColor
                            : useColorModeValue("#F0EDE8", "#333333")
                        }
                        p={3}
                        rounded="lg"
                        alignItems="center"
                        opacity={formData.gender === "female" ? 1 : 0.7}
                      >
                        <Icon
                          as={Ionicons}
                          name="female-outline"
                          size="md"
                          color={
                            formData.gender === "female" ? "white" : textColor
                          }
                        />
                        <Text
                          color={
                            formData.gender === "female" ? "white" : textColor
                          }
                          mt={1}
                          fontSize="xs"
                          fontWeight={
                            formData.gender === "female" ? "bold" : "normal"
                          }
                        >
                          Female
                        </Text>
                      </Box>
                    </Pressable>
                    <Pressable
                      flex={1}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, gender: "other" }))
                      }
                    >
                      <Box
                        bg={
                          formData.gender === "other"
                            ? accentColor
                            : useColorModeValue("#F0EDE8", "#333333")
                        }
                        p={3}
                        rounded="lg"
                        alignItems="center"
                        opacity={formData.gender === "other" ? 1 : 0.7}
                      >
                        <Icon
                          as={Ionicons}
                          name="person-outline"
                          size="md"
                          color={
                            formData.gender === "other" ? "white" : textColor
                          }
                        />
                        <Text
                          color={
                            formData.gender === "other" ? "white" : textColor
                          }
                          mt={1}
                          fontSize="xs"
                          fontWeight={
                            formData.gender === "other" ? "bold" : "normal"
                          }
                        >
                          Other
                        </Text>
                      </Box>
                    </Pressable>
                  </HStack>
                </FormControl>

                {/* Bio */}
                <FormControl>
                  <FormControl.Label _text={{ color: labelColor }}>
                    Bio
                  </FormControl.Label>
                  <PaperTextInput
                    value={formData.bio}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, bio: value }))
                    }
                    mode="outlined"
                    style={{
                      backgroundColor: "transparent",
                      height: 120,
                      textAlignVertical: "top",
                    }}
                    textColor={textColor}
                    theme={{
                      colors: {
                        primary: isDark ? "white" : "black",
                        placeholder: isDark ? "gray.400" : "gray.500",
                      },
                    }}
                    multiline
                    numberOfLines={6}
                    maxLength={250}
                    placeholder="Tell us about yourself..."
                  />
                  <Text
                    style={{
                      textAlign: "right",
                      marginTop: 4,
                      fontSize: 12,
                      opacity: 0.7,
                      color: labelColor,
                    }}
                  >
                    {formData.bio.length}/250 characters
                  </Text>
                </FormControl>
              </VStack>
            </Box>

            <Button
              onPress={handleUpdate}
              isLoading={loading}
              isLoadingText="Saving..."
              bg={accentColor}
              _pressed={{ bg: useColorModeValue("#D67A18", "#F09A3A") }}
              rounded="lg"
              py={3}
              mb={5}
            >
              Save Changes
            </Button>
          </VStack>
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  );
}
