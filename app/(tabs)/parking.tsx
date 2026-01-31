import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/context/translation-context';

export default function ParkingStatusScreen() {
    const { t } = useTranslation();
    const { token, user } = useAuth();
    const router = useRouter();
    const [spaces, setSpaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSpaces = async () => {
        try {
            const response = await axios.get(`${API_URL}/spaces`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSpaces(response.data);
        } catch (error) {
            console.error('Failed to fetch spaces:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSpaces();
    }, []);

    const availableCount = spaces.filter(s => s.status === 'AVAILABLE').length;
    const occupiedCount = spaces.filter(s => s.status === 'OCCUPIED').length;

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('parkingStatus')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <BlurView intensity={30} tint="dark" style={styles.summaryCard}>
                        {loading ? (
                            <Skeleton height={32} width={40} borderRadius={8} />
                        ) : (
                            <Text style={styles.summaryValue}>{availableCount}</Text>
                        )}
                        <Text style={styles.summaryLabel}>{t('available')}</Text>
                    </BlurView>
                    <BlurView intensity={30} tint="dark" style={styles.summaryCard}>
                        {loading ? (
                            <Skeleton height={32} width={40} borderRadius={8} />
                        ) : (
                            <Text style={styles.summaryValue}>{occupiedCount}</Text>
                        )}
                        <Text style={styles.summaryLabel}>{t('occupied')}</Text>
                    </BlurView>
                </View>

                {/* Grid */}
                <Text style={styles.sectionTitle}>{t('myAssignedSpots')}</Text>
                <View style={styles.grid}>
                    {loading ? (
                        [1, 2, 3, 4].map((i) => (
                            <View key={i} style={styles.skeletonWrapper}>
                                <Skeleton height={140} borderRadius={20} />
                            </View>
                        ))
                    ) : (
                        spaces.map((space) => (
                            <BlurView key={space.id} intensity={30} tint="dark" style={styles.spaceCard}>
                                <View style={[
                                    styles.statusIndicator,
                                    { backgroundColor: space.status === 'AVAILABLE' ? '#10b981' : '#ef4444' }
                                ]} />
                                <Ionicons
                                    name="car-sport"
                                    size={32}
                                    color={space.status === 'AVAILABLE' ? 'rgba(255,255,255,0.2)' : '#ffffff'}
                                />
                                <Text style={styles.spaceName}>{space.name}</Text>
                                <Text style={[
                                    styles.statusText,
                                    { color: space.status === 'AVAILABLE' ? '#10b981' : '#ef4444' }
                                ]}>
                                    {t(space.status.toLowerCase())}
                                </Text>
                            </BlurView>
                        ))
                    )}
                </View>

                {spaces.length === 0 && !loading && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="information-circle-outline" size={48} color="#64748b" />
                        <Text style={styles.emptyText}>{t('noAssignedSpots')}</Text>
                    </View>
                )}
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
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    skeletonWrapper: {
        width: '47.4%',
    },
    spaceCard: {
        width: '47.4%',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        gap: 8,
    },
    statusIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    spaceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
    },
});
