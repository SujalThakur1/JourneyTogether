import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useGroups } from "../../contexts/GroupsContext";

interface DestinationSearchInputProps {
  placeholder?: string;
  label?: string;
  helperText?: string;
}

const DestinationSearchInput = ({
  placeholder = "Enter destination",
  label = "Destination",
  helperText,
}: DestinationSearchInputProps) => {
  const {
    destination,
    setDestination,
    isDark,
    textColor,
    inputTextColor,
    inputBorderColor,
    focusedBorderColor,
    focusedInput,
    setFocusedInput,
    setDestinationCoordinates,
  } = useGroups();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder={placeholder}
          onPress={(data, details = null) => {
            console.log("Selected destination:", data.description);
            setDestination(data.description);
            if (details?.geometry?.location) {
              console.log("Coordinates:", details.geometry.location);
              setDestinationCoordinates({
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
              });
            }
          }}
          query={{
            key:
              process.env.GOOGLE_MAPS_API_KEY ||
              "AIzaSyCsbZUOz1ridK9xRMBhyJylVrfV0lMma2g",
            language: "en",
          }}
          fetchDetails={true}
          styles={{
            container: {
              flex: 0,
              zIndex: 20,
            },
            textInput: {
              ...styles.input,
              backgroundColor: isDark ? "#27272a" : "white",
              borderColor:
                focusedInput === "destination"
                  ? focusedBorderColor
                  : inputBorderColor,
              color: inputTextColor,
            },
            listView: {
              backgroundColor: isDark ? "#27272a" : "white",
              borderWidth: 1,
              borderColor: inputBorderColor,
              borderRadius: 8,
              position: "absolute",
              bottom: 45,
              left: 0,
              right: 0,
              zIndex: 20,
            },
            row: {
              backgroundColor: isDark ? "#27272a" : "white",
              padding: 13,
            },
            description: {
              color: inputTextColor,
            },
            separator: {
              height: 1,
              backgroundColor: isDark ? "#3f3f46" : "#e5e5e5",
            },
          }}
          textInputProps={{
            onFocus: () => setFocusedInput("destination"),
            onBlur: () => setFocusedInput(null),
            selectionColor: inputTextColor,
            placeholderTextColor: "gray",
            value: destination,
            onChangeText: setDestination,
          }}
          enablePoweredByContainer={false}
          debounce={300}
          minLength={2}
          keyboardShouldPersistTaps="handled"
          listViewDisplayed="auto"
          disableScroll={true}
        />
      </View>
      {helperText && (
        <Text
          style={[
            styles.helperText,
            { color: isDark ? "gray.400" : "gray.600" },
          ]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  autocompleteContainer: {
    zIndex: 20,
    position: "relative",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default DestinationSearchInput;
