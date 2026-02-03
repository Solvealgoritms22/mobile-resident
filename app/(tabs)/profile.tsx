import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3b82f6&color=fff&size=128&name=';

export default function ProfileScreen() {
    const { user, logout, updateUser, token } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const { showToast } = useToast();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [updatingPrefs, setUpdatingPrefs] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getInitials = (name: string) => {
        return name?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'R';
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm(t('signOutConfirm'))) {
                logout();
            }
        } else {
            Alert.alert(
                t('signOut'),
                t('signOutConfirm'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('signOut'), onPress: logout, style: 'destructive' },
                ]
            );
        }
    };

    const toggleNotifications = async (value: boolean) => {
        if (updatingPrefs || !user) return;
        setUpdatingPrefs(true);
        try {
            await axios.patch(`${API_URL}/users/${user.id}/push-settings`, {
                enabled: value
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await updateUser({ pushNotificationsEnabled: value });
            showToast(value ? 'Notifications enabled' : 'Notifications disabled', 'success');
        } catch (error: any) {
            console.error('Failed to update notification preferences:', error);
            showToast('Failed to update preferences', 'error');
        } finally {
            setUpdatingPrefs(false);
        }
    };

    const handleImagePick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission to access media library is required', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            await uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        setImageError(false);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } else {
                formData.append('file', {
                    uri,
                    name: filename,
                    type,
                } as any);
            }

            // 1. Upload to server
            const uploadResponse = await axios.post(`${API_URL}/uploads/profile-image`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            const imageUrl = uploadResponse.data.url;

            // 2. Update user profile
            await axios.patch(`${API_URL}/users/${user?.id}`, {
                profileImage: imageUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Update local state
            await updateUser({ profileImage: imageUrl });
            showToast('Profile image updated', 'success');
        } catch (error: any) {
            console.error('Upload error:', error);
            showToast(error.response?.data?.message || 'Failed to update profile image', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    const getProfileImage = () => {
        if (!user.profileImage) return null;
        if (user.profileImage.startsWith('http')) return user.profileImage;
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const path = user.profileImage.startsWith('/') ? user.profileImage : `/${user.profileImage}`;
        return `${baseUrl}${path}`;
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleImagePick} disabled={uploading} style={styles.avatarContainer}>
                        <BlurView intensity={80} tint="dark" style={styles.avatarBlur}>
                            {(user.profileImage && !imageError) ? (
                                <Image
                                    source={{ uri: getProfileImage() || undefined }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                    transition={500}
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarFallbackText}>{getInitials(user.name)}</Text>
                                </View>
                            )}
                            {uploading && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator color="#ffffff" />
                                </View>
                            )}
                        </BlurView>
                        {!uploading && (
                            <View style={styles.editIconContainer}>
                                <Ionicons name="camera" size={20} color="#ffffff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.roleLabel}>{t('residentAccount')}</Text>
                    <Text style={styles.nameText}>{user.name}</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.activeDot} />
                        <Text style={styles.statusTextLabel}>{t('activeMember')}</Text>
                    </View>
                </View>

                {/* Account Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeaderTitle}>{t('accountDetails')}</Text>

                    <View style={styles.infoGrid}>
                        <BlurView intensity={30} tint="dark" style={styles.infoBox}>
                            <Ionicons name="mail-outline" size={22} color="#94a3b8" style={{ marginBottom: 8 }} />
                            <Text style={styles.infoBoxLabel}>{t('email')}</Text>
                            <Text style={styles.infoBoxValue} numberOfLines={1}>{user.email}</Text>
                        </BlurView>

                        <BlurView intensity={30} tint="dark" style={styles.infoBox}>
                            <Ionicons name="card-outline" size={22} color="#94a3b8" style={{ marginBottom: 8 }} />
                            <Text style={styles.infoBoxLabel}>{t('identification')}</Text>
                            <Text style={styles.infoBoxValue}>{user.idNumber || 'N/A'}</Text>
                        </BlurView>
                    </View>

                    <View style={[styles.infoGrid, { marginTop: 16 }]}>
                        <BlurView intensity={30} tint="dark" style={styles.infoBox}>
                            <Ionicons name="call-outline" size={22} color="#94a3b8" style={{ marginBottom: 8 }} />
                            <Text style={styles.infoBoxLabel}>{t('phoneNumber')}</Text>
                            <Text style={styles.infoBoxValue}>{user.phone || 'N/A'}</Text>
                        </BlurView>

                        <BlurView intensity={30} tint="dark" style={styles.infoBox}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#94a3b8" style={{ marginBottom: 8 }} />
                            <Text style={styles.infoBoxLabel}>{t('accessRole')}</Text>
                            <Text style={styles.infoBoxValue}>{user.role}</Text>
                        </BlurView>
                    </View>
                </View>

                {/* Settings & System */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeaderTitle}>{t('settingsSystem')}</Text>

                    <BlurView intensity={20} tint="dark" style={styles.optionItem}>
                        <View style={[styles.optionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.optionTextLabel}>{t('pushNotifications')}</Text>
                            <Text style={styles.optionSubtext}>{t('arrivalAlerts')}</Text>
                        </View>
                        <Switch
                            value={user.pushNotificationsEnabled ?? true}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#334155', true: '#3b82f6' }}
                            thumbColor={Platform.OS === 'ios' ? '#ffffff' : (user.pushNotificationsEnabled ?? true) ? '#ffffff' : '#94a3b8'}
                        />
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.optionItem}>
                        <View style={[styles.optionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="language-outline" size={20} color="#3b82f6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.optionTextLabel}>{t('language')}</Text>
                            <Text style={styles.optionSubtext}>{t('appLanguage')}</Text>
                        </View>
                        <View style={styles.languageToggleContainer}>
                            <TouchableOpacity
                                onPress={() => setLanguage('en')}
                                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                            >
                                <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLanguage('es')}
                                style={[styles.langBtn, language === 'es' && styles.langBtnActive]}
                            >
                                <Text style={[styles.langBtnText, language === 'es' && styles.langBtnTextActive]}>ES</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>

                    <View style={{ opacity: 0.5 }}>
                        <BlurView intensity={20} tint="dark" style={styles.optionItem}>
                            <View style={[styles.optionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.optionTextLabel}>{t('privacySecurity')}</Text>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>{t('soon')}</Text>
                            </View>
                        </BlurView>
                    </View>

                    <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={{ marginTop: 24 }}>
                        <BlurView intensity={40} tint="dark" style={[styles.optionItem, styles.logoutItem]}>
                            <View style={[styles.optionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            </View>
                            <Text style={[styles.optionTextLabel, { color: '#ef4444' }]}>{t('signOut')}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#ef4444" />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionStyle}>{t('version')} 1.2.0 • COSEVI {t('residentAccount')}</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 80,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarBlur: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    avatarImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    avatarFallback: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    avatarInner: {
        width: 94,
        height: 94,
        borderRadius: 47,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3b82f6',
        letterSpacing: 2,
        marginBottom: 8,
    },
    nameText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 8,
    },
    statusTextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10b981',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0f172a',
        zIndex: 10,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        paddingLeft: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    infoBox: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    infoBoxLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 4,
    },
    infoBoxValue: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '700',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginBottom: 12,
        gap: 16,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTextLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    optionSubtext: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    logoutItem: {
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    versionStyle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    comingSoonBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    comingSoonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    languageToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    langBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    langBtnActive: {
        backgroundColor: '#3b82f6',
    },
    langBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
    },
    langBtnTextActive: {
        color: '#ffffff',
    },
});
