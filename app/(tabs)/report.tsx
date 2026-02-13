import { IncidentDetailModal } from '@/components/IncidentDetailModal';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ReportIncidentScreen() {
    const { t } = useTranslation();
    const { token, tenantChannel } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // History states
    const [reports, setReports] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const incidentTypes = [
        { id: 'maintenance', label: t('typeMaintenance'), icon: 'hammer-outline', color: '#10b981' },
        { id: 'security', label: t('typeSecurity'), icon: 'shield-outline', color: '#3b82f6' },
        { id: 'support', label: t('typeSupport'), icon: 'help-buoy-outline', color: '#8b5cf6' },
        { id: 'other', label: t('typeOther'), icon: 'ellipsis-horizontal-circle-outline', color: '#64748b' },
    ];

    const fetchHistory = async () => {
        setRefreshing(true);
        try {
            const response = await axios.get(`${API_URL}/reports/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            showToast(t('errorGeneric'), 'error');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        if (!tenantChannel) return;

        const handleRefresh = () => {
            if (activeTab === 'history') {
                fetchHistory();
            }
        };

        tenantChannel.bind('incidentCreated', handleRefresh);
        tenantChannel.bind('incidentStatusUpdated', handleRefresh);

        return () => {
            tenantChannel.unbind('incidentCreated', handleRefresh);
            tenantChannel.unbind('incidentStatusUpdated', handleRefresh);
        };
    }, [tenantChannel, activeTab]);

    const handleSubmit = async () => {
        if (!incidentType || !description) {
            showToast(t('selectTypeAndDescription'), 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/reports`, {
                type: incidentType,
                description
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Alert.alert(
                t('reportSubmittedTitle'),
                t('reportSubmittedMessage'),
                [{
                    text: 'OK', onPress: () => {
                        setIncidentType('');
                        setDescription('');
                        setActiveTab('history');
                    }
                }]
            );
        } catch (error) {
            console.error('Failed to submit report:', error);
            showToast(t('errorGeneric'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderNewReport = () => (
        <View style={styles.tabContent}>
            {/* Incident Type Selection */}
            <Text style={styles.sectionTitle}>{t('reportTitle')}</Text>
            <View style={styles.typesGrid}>
                {incidentTypes.map((type) => (
                    <Pressable
                        key={type.id}
                        onPress={() => setIncidentType(type.id)}
                        style={styles.typeButton}
                    >
                        <BlurView
                            intensity={incidentType === type.id ? 40 : 30}
                            tint="dark"
                            style={[
                                styles.typeCard,
                                incidentType === type.id && styles.typeCardActive,
                            ]}
                        >
                            {incidentType === type.id && (
                                <LinearGradient
                                    colors={[`${type.color}30`, `${type.color}10`]}
                                    style={StyleSheet.absoluteFill}
                                />
                            )}
                            <View style={[styles.typeIcon, { backgroundColor: `${type.color}30` }]}>
                                <Ionicons name={type.icon as any} size={28} color={type.color} />
                            </View>
                            <Text style={styles.typeLabel}>{type.label}</Text>
                            {incidentType === type.id && (
                                <View style={styles.checkmark}>
                                    <Ionicons name="checkmark-circle" size={20} color={type.color} />
                                </View>
                            )}
                        </BlurView>
                    </Pressable>
                ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionTitle}>{t('details')}</Text>
            <BlurView intensity={30} tint="dark" style={styles.descriptionCard}>
                <TextInput
                    style={styles.textArea}
                    placeholder={t('reportDetailsPlaceholder')}
                    placeholderTextColor="#64748b"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />
            </BlurView>

            {/* Submit Button */}
            <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                <LinearGradient
                    colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                    style={styles.submitButton}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="send" size={20} color="#ffffff" />
                            <Text style={styles.submitText}>{t('sendReport')}</Text>
                        </>
                    )}
                </LinearGradient>
            </Pressable>
        </View>
    );

    const renderHistory = () => (
        <View style={styles.tabContent}>
            {reports.length > 0 ? (
                reports.map((item: any) => {
                    const getStatusColor = (status: string) => {
                        switch (status?.toUpperCase()) {
                            case 'OPEN': return '#ef4444';
                            case 'INVESTIGATING': return '#f59e0b';
                            case 'RESOLVED': return '#10b981';
                            default: return '#64748b';
                        }
                    };

                    return (
                        <Pressable
                            key={item.id}
                            style={styles.reportItemContainer}
                            onPress={() => {
                                setSelectedIncident(item);
                                setModalVisible(true);
                            }}
                        >
                            <BlurView intensity={30} tint="dark" style={styles.reportItem}>
                                <View style={styles.reportHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20`, borderColor: getStatusColor(item.status) }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                                    </View>
                                    <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.reportType}>{item.type.replace('_', ' ')}</Text>
                                <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
                                <View style={styles.reportFooter}>
                                    <View style={styles.commentCount}>
                                        <Ionicons name="chatbubbles-outline" size={16} color="#3b82f6" />
                                        <Text style={styles.commentCountText}>{item.comments?.length || 0} {t('discussion')}</Text>
                                    </View>
                                    <View style={styles.viewButton}>
                                        <Text style={styles.viewButtonText}>{t('viewDiscussion')}</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                                    </View>
                                </View>
                            </BlurView>
                        </Pressable>
                    );
                })
            ) : refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyText}>{t('noReportsFound')}</Text>
                </View>
            )}
        </View>
    );

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.title}>{t('reportService')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabsContainer}>
                <Pressable
                    onPress={() => setActiveTab('new')}
                    style={[styles.tab, activeTab === 'new' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>{t('reportTitle')}</Text>
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('history')}
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>{t('reportHistory')}</Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchHistory}
                        tintColor="#ffffff"
                    />
                }
            >
                {activeTab === 'new' ? renderNewReport() : renderHistory()}
            </ScrollView>

            <IncidentDetailModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                incident={selectedIncident}
                onCommentAdded={fetchHistory}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        marginBottom: 20,
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
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeTab: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 0.4)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    activeTabText: {
        color: '#3b82f6',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 160,
    },
    tabContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    typesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    typeButton: {
        width: '48%',
    },
    typeCard: {
        width: '100%',
        aspectRatio: 1.4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    typeCardActive: {
        borderColor: 'rgba(59, 130, 246, 0.5)',
    },
    typeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    descriptionCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginBottom: 32,
    },
    textArea: {
        color: '#ffffff',
        fontSize: 16,
        minHeight: 150,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        borderRadius: 20,
        minHeight: 64,
        marginBottom: 40,
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    // History Styles
    reportItemContainer: {
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    reportItem: {
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    reportDate: {
        fontSize: 12,
        color: '#64748b',
    },
    reportType: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    reportDesc: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 16,
        lineHeight: 20,
    },
    reportFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    commentCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    commentCountText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '600',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        gap: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    loadingContainer: {
        paddingVertical: 80,
    },
});

