import React, { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface OtpInputProps {
  value: string[];
  onChange: (code: string[]) => void;
  editable?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  editable = true,
}) => {
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...value];
    newCode[index] = text.charAt(text.length - 1);
    onChange(newCode);

    if (text && index < value.length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
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
              maxLength={1}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              editable={editable}
              textAlign="center"
              autoCapitalize="characters"
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
  },
  input: {
    fontSize: 24,
    fontWeight: "600",
    width: "100%",
    height: "100%",
    color: "#1C1C1E",
  },
  charText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
  },
});

export default OtpInput;
