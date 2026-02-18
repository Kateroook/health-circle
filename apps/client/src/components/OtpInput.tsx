import React, { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface OtpInputProps {
  value: string[];
  onChange: (code: string[]) => void;
  editable?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, editable = true }) => {
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow alphanumeric characters (letters and numbers)
    const filtered = text.replace(/[^a-zA-Z0-9]/g, "");
    if (!filtered && text) return; // ignore if all chars were invalid

    const newCode = [...value];

    if (filtered.length > 1) {
      const chars = filtered.split("");
      chars.forEach((char, i) => {
        const targetIndex = index + i;
        if (targetIndex < value.length) {
          newCode[targetIndex] = char.toUpperCase();
        }
      });
      onChange(newCode);
      const nextIndex = Math.min(index + chars.length, value.length - 1);
      refs.current[nextIndex]?.focus();
    } else {
      newCode[index] = filtered.toUpperCase();
      onChange(newCode);
      if (filtered && index < value.length - 1) {
        refs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!value[index] && index > 0) {
        refs.current[index - 1]?.focus();
        const newCode = [...value];
        newCode[index - 1] = "";
        onChange(newCode);
      }
    }
  };

  return (
    <View style={styles.row}>
      {value.map((char, i) => (
        <View key={i} style={styles.box}>
          {editable ? (
            <TextInput
              ref={(r) => (refs.current[i] = r)}
              style={styles.input}
              value={char}
              maxLength={value.length}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              editable={editable}
              selectTextOnFocus={true}
              textAlign="center"
              autoCapitalize="characters"
              keyboardType="default"
            />
          ) : (
            <Text style={styles.charText}>{char}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  box: {
    width: 46,
    height: 56,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  input: {
    fontSize: 24,
    fontWeight: "600",
    width: "100%",
    height: "100%",
    color: "#1C1C1E",
    textAlign: "center",
    padding: 0,
  },
  charText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
  },
});

export default OtpInput;
