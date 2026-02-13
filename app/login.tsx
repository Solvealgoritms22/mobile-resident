import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

export default function LoginScreen() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
    const [brandingName, setBrandingName] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const tenantId = await AsyncStorage.getItem('tenantId');
                if (tenantId) {
                    const res = await fetch(`${API_URL}/tenants/${tenantId}/branding`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.logoUrl) {
                            setBrandingLogo(`${API_URL}${data.logoUrl}`);
                        }
                        if (data.name) {
                            setBrandingName(data.name);
                        }
                    }
                }
            } catch { }
        })();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            await login(email, password);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || t('errorLogin'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <BlurView intensity={40} tint="dark" style={styles.logoContainer}>
                        {brandingLogo ? (
                            <Image source={{ uri: brandingLogo }} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="contain" />
                        ) : (
                            <Ionicons name="home" size={64} color="#10b981" />
                        )}
                    </BlurView>
                    <Text style={styles.title}>{brandingName || t('residentPortal')}</Text>
                    <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>
                </View>

                {/* Form */}
                <BlurView intensity={30} tint="dark" style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('email')}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="example@email.com"
                                placeholderTextColor="#64748b"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('password')}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    {errorMsg ? (
                        <BlurView intensity={40} tint="dark" style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </BlurView>
                    ) : null}

                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        style={styles.loginButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669', '#047857']}
                            style={styles.loginButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="log-in-outline" size={24} color="#ffffff" />
                                    <Text style={styles.loginButtonText}>{t('loginButton')}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </BlurView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        overflow: 'hidden',
    },
    errorText: {
        flex: 1,
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButtonWrapper: {
        marginTop: 8,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 18,
        borderRadius: 16,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
