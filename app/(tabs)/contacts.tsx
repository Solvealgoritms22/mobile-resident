import { Skeleton } from '@/components/ui/Skeleton';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ContactsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { t } = useTranslation();
    const [contacts, setContacts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const getImageUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${normalizedPath}`;
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter: SECURITY or ADMIN role AND has phone number
            const filtered = response.data.filter((u: any) =>
                (u.role === 'SECURITY' || u.role === 'ADMIN') && u.phone
            );

            setContacts(filtered);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = async (phone: string) => {
        try {
            const url = `tel:${phone}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', t('errorCallNotSupported'));
            }
        } catch (error) {
            console.error('Failed to make a call:', error);
        }
    };

    const handleWhatsApp = async (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', t('errorWhatsAppNotSupported'));
            }
        } catch (error) {
            console.error('Failed to open WhatsApp:', error);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('officialContacts')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <BlurView intensity={30} tint="dark" style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('searchContactsPlaceholder')}
                        placeholderTextColor="#64748b"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </Pressable>
                    )}
                </BlurView>

                {loading ? (
                    <View style={{ gap: 12, paddingBottom: 40 }}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} borderRadius={20} />)}
                    </View>
                ) : (
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyText}>{t('noContactsFound')}</Text>
                            </View>
                        }
                        renderItem={({ item: contact }) => (
                            <BlurView intensity={40} tint="dark" style={styles.contactCard}>
                                <View style={styles.contactInfo}>
                                    <View style={styles.avatarContainer}>
                                        {(contact.profileImage && !imageErrors[contact.id]) ? (
                                            <Image
                                                source={{ uri: getImageUrl(contact.profileImage) || undefined }}
                                                style={styles.avatar}
                                                contentFit="cover"
                                                transition={500}
                                                onError={() => setImageErrors(prev => ({ ...prev, [contact.id]: true }))}
                                            />
                                        ) : (
                                            <View style={[styles.avatarFallback, { backgroundColor: contact.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)' }]}>
                                                <Text style={[styles.avatarText, { color: contact.role === 'ADMIN' ? '#8b5cf6' : '#3b82f6' }]}>
                                                    {contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.details}>
                                        <Text style={styles.name}>{contact.name}</Text>
                                        <View style={styles.roleTag}>
                                            <Text style={styles.roleText}>{contact.role}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.actions}>
                                    <Pressable
                                        style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                                        onPress={() => handleWhatsApp(contact.phone)}
                                    >
                                        <Ionicons name="logo-whatsapp" size={20} color="#10b981" />
                                    </Pressable>
                                    <Pressable
                                        style={[styles.actionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}
                                        onPress={() => handleCall(contact.phone)}
                                    >
                                        <Ionicons name="call" size={20} color="#3b82f6" />
                                    </Pressable>
                                </View>
                            </BlurView>
                        )}
                    />
                )}
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
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
        overflow: 'hidden',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 12,
        overflow: 'hidden',
    },
    contactInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    roleTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    roleText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#64748b',
        fontSize: 16,
    },
});
