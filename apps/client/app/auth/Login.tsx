import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import SafeScreen from "../components/SafeScreen";
import Icon from "react-native-vector-icons/Feather";

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin() {
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            router.navigate("/Home");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeScreen>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Icon name="lock" size={36} color="#FF6B6B" />
                    </View>
                    <Text style={styles.title}>Вітаємо знову!</Text>
                    <Text style={styles.subtitle}>
                        Увійдіть, щоб продовжити турбуватися про близьких
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            placeholder="example@mail.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Пароль</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="Введіть пароль"
                                value={password}
                                secureTextEntry={!showPassword}
                                onChangeText={setPassword}
                                style={styles.passwordInput}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Icon
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.primaryButtonText}>
                                {loading ? "Вхід..." : "Увійти"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Ще немає акаунту?{" "}
                        <Text
                            style={styles.footerLink}
                            onPress={() => router.push("/auth/Register")}
                        >
                            Зареєструватися
                        </Text>
                    </Text>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => router.replace("/Home")}
                    >
                        <Text style={styles.skipButtonText}>Пропустити</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 48,
        backgroundColor: "#FAFAFA",
        justifyContent: "space-between",
    },
    header: {
        alignItems: "center",
        marginTop: 40,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#FFF4E5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        marginTop: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        fontSize: 16,
        color: "#1A1A1A",
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#1A1A1A",
    },
    eyeButton: {
        paddingHorizontal: 16,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFE5E5",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: "#D32F2F",
        fontSize: 14,
        flex: 1,
    },
    buttonsContainer: {
        marginTop: 8,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: "#FF6B6B",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: "#FF6B6B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#FFB3B3",
        opacity: 0.7,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    footer: {
        alignItems: "center",
        gap: 16,
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: "#666",
    },
    footerLink: {
        color: "#FF6B6B",
        fontWeight: "600",
    },
    skipButton: {
        paddingVertical: 8,
    },
    skipButtonText: {
        color: "#999",
        fontSize: 14,
        fontWeight: "500",
    },
});
