import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
      screenListeners={{
        beforeRemove: (e) => {},
      }}
    >
      <Stack.Screen
        name="SignIn"
        options={{
          animation: "slide_from_left",
        }}
      />
      <Stack.Screen
        name="SignUp"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
function useEffect(arg0: () => void, arg1: any[]) {
  throw new Error("Function not implemented.");
}
