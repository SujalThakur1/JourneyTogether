import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../../contexts/ColorContext";

const { width } = Dimensions.get("window");

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onDismiss,
}) => {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const getToastColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      case "warning":
        return "#FF9800";
      case "info":
      default:
        return colors.accentColor;
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "warning";
      case "info":
      default:
        return "information-circle";
    }
  };

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      timeout.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.cardBgColor,
          borderLeftColor: getToastColor(),
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View
          style={[styles.iconContainer, { backgroundColor: getToastColor() }]}
        >
          <Ionicons name={getToastIcon()} size={24} color="white" />
        </View>
        <Text
          style={[styles.message, { color: colors.textColor }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={colors.mutedTextColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Manager to handle multiple toasts
type ToastOptions = {
  message: string;
  type?: ToastType;
  duration?: number;
};

export class ToastManager {
  static singleton: ToastManager;
  static listener: ((options: ToastOptions) => void) | null = null;

  static show(options: ToastOptions) {
    if (ToastManager.listener) {
      ToastManager.listener(options);
    }
  }

  static setListener(listener: (options: ToastOptions) => void) {
    ToastManager.listener = listener;
  }

  static removeListener() {
    ToastManager.listener = null;
  }
}

// ToastContainer component to be used at the top level of your app
export const ToastContainer: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<ToastType>("info");
  const [duration, setDuration] = React.useState(3000);

  useEffect(() => {
    ToastManager.setListener(({ message, type = "info", duration = 3000 }) => {
      setMessage(message);
      setType(type);
      setDuration(duration);
      setVisible(true);
    });

    return () => {
      ToastManager.removeListener();
    };
  }, []);

  return (
    <Toast
      visible={visible}
      message={message}
      type={type}
      duration={duration}
      onDismiss={() => setVisible(false)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
    borderLeftWidth: 6,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    flex: 1,
    paddingRight: 10,
  },
  closeButton: {
    padding: 6,
  },
});
