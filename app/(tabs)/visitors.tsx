import { Skeleton } from '@/components/ui/Skeleton';
import { VisitDetailModal } from '@/components/VisitDetailModal';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function VisitorsScreen() {
    const { user, token } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchVisitors = async () => {
        if (!user) return;
        try {
            let url = `${API_URL}/visits/my-visits/${user.id}`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setVisitors(response.data);
        } catch (err) {
            console.error('Error fetching visitors:', err);
        } finally {
            setLoading(false);
        }
    };

    const { onDataRefresh } = useAuth();

    useEffect(() => {
        fetchVisitors();

        // Subscribe to global data refresh events
        const unsubscribe = onDataRefresh(() => {
            fetchVisitors();
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchVisitors();
        setRefreshing(false);
    };

    const handleShare = () => {
        Alert.alert('Shared', 'Invitation link shared to WhatsApp');
    };

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'CHECKED_IN' || s === 'APPROVED') return '#10b981';
        if (s === 'CHECKED_OUT') return '#3b82f6';
        if (s === 'PENDING') return '#f59e0b';
        return '#ef4444';
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <BlurView intensity={80} tint="dark" style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>{t('visitorHistory')}</Text>
                        <Text style={styles.subtitle}>{visitors.length} {t('totalRecords')}</Text>
                    </View>
                </View>

                <View style={styles.filterContainer}>
                    <View style={styles.dateInputContainer}>
                        <Text style={styles.dateLabel}>{t('startDate')}</Text>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#64748b"
                            value={startDate}
                            onChangeText={setStartDate}
                        />
                    </View>
                    <View style={styles.dateInputContainer}>
                        <Text style={styles.dateLabel}>{t('endDate')}</Text>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#64748b"
                            value={endDate}
                            onChangeText={setEndDate}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterButton} onPress={fetchVisitors}>
                        <Ionicons name="filter" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </BlurView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {loading ? (
                    <View style={{ gap: 16 }}>
                        <Skeleton height={120} borderRadius={20} />
                        <Skeleton height={120} borderRadius={20} />
                        <Skeleton height={120} borderRadius={20} />
                        <Skeleton height={120} borderRadius={20} />
                    </View>
                ) : visitors.length > 0 ? (
                    visitors.map((visitor: any) => (
                        <BlurView key={visitor.id} intensity={40} tint="dark" style={styles.visitorCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(visitor.status)}20` }]}>
                                    <Ionicons name="person" size={24} color={getStatusColor(visitor.status)} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(visitor.status)}20`, borderColor: `${getStatusColor(visitor.status)}40` }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                                                {visitor.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.visitorMeta}>
                                        {visitor.licensePlate || t('noVehicle')} • {new Date(visitor.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <View style={styles.timeInfo}>
                                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                                    <Text style={styles.timeText}>
                                        {new Date(visitor.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(visitor.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                {(visitor.status === 'PENDING' || visitor.status === 'APPROVED') && (
                                    <TouchableOpacity
                                        style={styles.viewPassButton}
                                        onPress={() => {
                                            setSelectedVisit(visitor);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <Text style={styles.viewPassText}>{t('viewPass')}</Text>
                                        <Ionicons name="qr-code-outline" size={16} color="#3b82f6" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </BlurView>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <BlurView intensity={40} tint="dark" style={styles.emptyBlur}>
                            <Ionicons name="people-outline" size={64} color="#64748b" />
                            <Text style={styles.emptyTitle}>{t('noVisitorsFound')}</Text>
                            <Text style={styles.emptyText}>{t('adjustFilterHint')}</Text>
                        </BlurView>
                    </View>
                )}
            </ScrollView>

            <VisitDetailModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedVisit(null);
                }}
                visit={selectedVisit}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 60,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
        alignItems: 'flex-end',
    },
    dateInputContainer: {
        flex: 1,
    },
    dateLabel: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    dateInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 12,
        color: '#ffffff',
        fontSize: 14,
    },
    filterButton: {
        backgroundColor: '#3b82f6',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
        gap: 16,
        paddingBottom: 100,
    },
    visitorCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    visitorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    visitorMeta: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    viewPassButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    viewPassText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3b82f6',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyBlur: {
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '100%',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    closeModal: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 32,
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    qrBackground: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
    },
    visitorModalInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    accessCodeContainer: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    accessCodeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    accessCodeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 4,
    },
    modalVisitorName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    modalVisitorPlate: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
    },
    shareButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        width: '100%',
    },
    shareButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    validityText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
});
