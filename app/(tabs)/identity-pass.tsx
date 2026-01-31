import { View, Text, StyleSheet, Pressable, Dimensions, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/auth-context';
import { API_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

import { useTranslation } from '@/context/translation-context';

export default function IdentityPassScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useTranslation();

    if (!user) return null;

    // Use user ID or a specific identity token for the QR code
    const qrValue = JSON.stringify({
        id: user.id,
        type: 'RESIDENT_ID',
        name: user.name,
        unit: user.residentProfile?.unitNumber || 'N/A',
        timestamp: new Date().toISOString()
    });

    const getProfileImage = () => {
        if (!user.profileImage) return null;
        if (user.profileImage.startsWith('http')) return user.profileImage;
        return `${API_URL}${user.profileImage}`;
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('identityPass')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Main Pass Card */}
                <BlurView intensity={80} tint="dark" style={styles.passCard}>
                    <LinearGradient
                        colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            {getProfileImage() ? (
                                <Image source={{ uri: getProfileImage()! }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={40} color="#3b82f6" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.roleLabel}>{t('resident').toUpperCase()}</Text>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        {user.residentProfile?.unitNumber && (
                            <View style={styles.unitBadge}>
                                <Ionicons name="business" size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                                <Text style={styles.unitText}>{user.residentProfile.unitNumber}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.qrContainer}>
                        <View style={styles.qrWrapper}>
                            <QRCode
                                value={qrValue}
                                size={width * 0.55}
                                color="#ffffff"
                                backgroundColor="transparent"
                            />
                        </View>
                        <Text style={styles.scanHint}>{t('scanHint')}</Text>
                    </View>

                    <View style={styles.footerInfo}>
                        <View style={styles.statusBadge}>
                            <View style={styles.activeDot} />
                            <Text style={styles.statusText}>{t('verifiedIdentity')}</Text>
                        </View>
                        <Text style={styles.expiryInfo}>{t('lastUpdated')}</Text>
                    </View>
                </BlurView>

                {/* Security Note */}
                <View style={styles.noteContainer}>
                    <Ionicons name="shield-checkmark" size={20} color="#94a3b8" />
                    <Text style={styles.noteText}>
                        {t('personalNote')}
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    passCard: {
        width: '100%',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        borderColor: '#3b82f6',
        marginBottom: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3b82f6',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    userEmail: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
        marginBottom: 16,
    },
    unitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    unitText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    scanHint: {
        marginTop: 16,
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    footerInfo: {
        alignItems: 'center',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10b981',
    },
    expiryInfo: {
        fontSize: 11,
        color: '#64748b',
    },
    noteContainer: {
        flexDirection: 'row',
        marginTop: 32,
        paddingHorizontal: 16,
        gap: 12,
        alignItems: 'center',
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
});
