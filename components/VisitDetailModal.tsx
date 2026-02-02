import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

interface VisitDetailModalProps {
    visible: boolean;
    onClose: () => void;
    visit: any;
}

export const VisitDetailModal = ({ visible, onClose, visit }: VisitDetailModalProps) => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [cancelling, setCancelling] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    if (!visit) return null;

    const images = visit.images ? JSON.parse(visit.images) : [];

    const getStatusConfig = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'CHECKED_IN' || s === 'APPROVED') return { label: 'APPROVED', color: '#10b981' };
        if (s === 'PENDING') return { label: 'PENDING', color: '#f59e0b' };
        if (s === 'EXPIRED') return { label: 'EXPIRED', color: '#64748b' };
        return { label: s || 'UNKNOWN', color: '#ef4444' };
    };

    const config = getStatusConfig(visit.status);

    const handleCancel = () => {
        Alert.alert(
            'Cancel Invitation',
            'Are you sure you want to nullify this invitation? Any assigned parking will be released.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await axios.patch(`${API_URL}/visits/${visit.id}/cancel`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            showToast('Invitation cancelled', 'success');
                            onClose();
                        } catch (error: any) {
                            showToast(error.response?.data?.message || 'Failed to cancel invitation', 'error');
                        } finally {
                            setCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await axios.patch(`${API_URL}/visits/${visit.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast(t('visitApproved'), 'success');
            onClose();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to approve', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeny = async () => {
        setActionLoading(true);
        try {
            await axios.patch(`${API_URL}/visits/${visit.id}/deny`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast(t('visitDenied'), 'success');
            onClose();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to deny', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const isCancellable = visit.status === 'PENDING' || visit.status === 'APPROVED';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('details')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            <View style={[styles.statusRibbon, { backgroundColor: `${config.color}20` }]}>
                                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                <Text style={[styles.statusLabel, { color: config.color }]}>{t(config.label.toLowerCase())}</Text>
                            </View>

                            {visit.isVip && (
                                <View style={[styles.statusRibbon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                    <Ionicons name="star" size={12} color="#f59e0b" />
                                    <Text style={[styles.statusLabel, { color: '#f59e0b' }]}>{t('vipMember')}</Text>
                                </View>
                            )}

                            {visit.visitorCategory && (
                                <View style={[styles.statusRibbon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                                    <Ionicons name="bookmark" size={12} color="#3b82f6" />
                                    <Text style={[styles.statusLabel, { color: '#3b82f6' }]}>{t(visit.visitorCategory.toLowerCase())}</Text>
                                </View>
                            )}
                        </View>

                        {/* QR Code Section (if available) */}
                        {(visit.qrCode || visit.accessCode) && visit.status !== 'EXPIRED' && (
                            <View style={styles.qrSection}>
                                <View style={styles.qrContainer}>
                                    <QRCode
                                        value={visit.qrCode || visit.accessCode || 'INVALID'}
                                        size={180}
                                        color="#000000"
                                        backgroundColor="#ffffff"
                                        quietZone={10}
                                    />
                                </View>
                                {visit.accessCode && (
                                    <View style={styles.accessCodeContainer}>
                                        <Text style={styles.accessCodeLabel}>{t('manualEntryCode')}</Text>
                                        <Text style={styles.accessCodeValue}>{visit.accessCode}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Images Section */}
                        {images.length > 0 ? (
                            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                                {images.map((img: string, index: number) => (
                                    <Image key={index} source={{ uri: img }} style={styles.visitorImage} />
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.noImageContainer}>
                                <Ionicons name="image-outline" size={48} color="#475569" />
                                <Text style={styles.noImageText}>{t('noVisitorsFound')}</Text>
                            </View>
                        )}

                        {/* Info Sections */}
                        <View style={styles.infoSection}>
                            <Text style={styles.visitorName}>{visit.visitorName || visit.name}</Text>
                            <Text style={styles.idNumber}>{visit.visitorIdNumber || visit.idNumber}</Text>
                        </View>

                        <View style={styles.grid}>
                            <View style={styles.gridItem}>
                                <Ionicons name="car-outline" size={20} color="#3b82f6" />
                                <View>
                                    <Text style={styles.gridLabel}>{t('vehiclePlate')}</Text>
                                    <Text style={styles.gridValue}>{visit.licensePlate || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.gridItem}>
                                <Ionicons name="people-outline" size={20} color="#3b82f6" />
                                <View>
                                    <Text style={styles.gridLabel}>{t('companions')}</Text>
                                    <Text style={styles.gridValue}>{visit.companionCount || 0}</Text>
                                </View>
                            </View>
                        </View>

                        {visit.space && (
                            <BlurView intensity={20} tint="dark" style={[styles.hostCard, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                                <Text style={[styles.hostHeader, { color: '#10b981' }]}>{t('parkingAllocationOptional')}</Text>
                                <View style={styles.hostRow}>
                                    <View style={[styles.hostAvatar, { backgroundColor: '#10b981' }]}>
                                        <Ionicons name="car" size={20} color="#ffffff" />
                                    </View>
                                    <View>
                                        <Text style={styles.hostName}>{visit.space.name}</Text>
                                        <Text style={styles.hostEmail}>Visitor parking assignment</Text>
                                    </View>
                                </View>
                            </BlurView>
                        )}

                        <BlurView intensity={20} tint="dark" style={styles.hostCard}>
                            <Text style={styles.hostHeader}>{t('welcome')} {t('resident')}</Text>
                            <View style={styles.hostRow}>
                                <View style={styles.hostAvatar}>
                                    <Ionicons name="person" size={20} color="#ffffff" />
                                </View>
                                <View>
                                    <Text style={styles.hostName}>{visit.host?.name || 'You'}</Text>
                                    <Text style={styles.hostEmail}>{visit.host?.email || 'Resident'}</Text>
                                </View>
                            </View>
                        </BlurView>

                        <View style={styles.metaInfo}>
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                <Text style={styles.metaText}>Created: {new Date(visit.createdAt).toLocaleString()}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={16} color="#64748b" />
                                <Text style={styles.metaText}>
                                    {t('validUntil')}: {
                                        new Date(visit.validUntil).getFullYear() > 2100
                                            ? t('indefinite')
                                            : new Date(visit.validUntil).toLocaleString()
                                    }
                                </Text>
                            </View>
                            {visit.entryTime && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="log-in-outline" size={16} color="#10b981" />
                                    <Text style={styles.metaText}>{t('entry')}: {new Date(visit.entryTime).toLocaleString()}</Text>
                                </View>
                            )}
                            {visit.exitTime && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="log-out-outline" size={16} color="#ef4444" />
                                    <Text style={styles.metaText}>{t('exit')}: {new Date(visit.exitTime).toLocaleString()}</Text>
                                </View>
                            )}
                        </View>

                        {isCancellable && (
                            <View style={{ gap: 12, marginTop: 24 }}>
                                {visit.status === 'PENDING' && visit.manualEntry && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.approveButton}
                                            onPress={handleApprove}
                                            disabled={actionLoading}
                                        >
                                            <LinearGradient colors={['#10b981', '#059669']} style={styles.shareGradient}>
                                                {actionLoading ? (
                                                    <ActivityIndicator color="#ffffff" size="small" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                                                        <Text style={styles.shareButtonText}>{t('approve')}</Text>
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.denyButton}
                                            onPress={handleDeny}
                                            disabled={actionLoading}
                                        >
                                            <View style={styles.denyButtonInner}>
                                                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                                                <Text style={styles.denyButtonText}>{t('deny')}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={styles.shareButton}
                                    onPress={async () => {
                                        const message = `*${t('shareSubject')}*\n\n${t('shareGreeting')} ${visit.visitorName || t('friend')},\n\n${t('shareBody')}\n\n*${t('shareAccessCode')}:* ${visit.accessCode}\n\n${t('shareInstructions')}`;
                                        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                        try {
                                            const supported = await Linking.canOpenURL(url);
                                            if (supported) {
                                                await Linking.openURL(url);
                                            } else {
                                                Alert.alert('Sharing', message);
                                            }
                                        } catch (error) {
                                            console.error('Failed to share:', error);
                                        }
                                    }}
                                >
                                    <LinearGradient colors={['#25D366', '#1da851']} style={styles.shareGradient}>
                                        <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                                        <Text style={styles.shareButtonText}>{t('shareWhatsApp')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={handleCancel}
                                    disabled={cancelling}
                                >
                                    {cancelling ? (
                                        <ActivityIndicator color="#ffffff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={20} color="#ffffff" />
                                            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </BlurView>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        padding: 24,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    statusRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        alignSelf: 'flex-start',
        marginBottom: 20,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    imageGallery: {
        width: '100%',
        height: 250,
        borderRadius: 24,
        marginBottom: 24,
    },
    visitorImage: {
        width: width - 48,
        height: 250,
        borderRadius: 24,
        resizeMode: 'cover',
    },
    noImageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    noImageText: {
        color: '#64748b',
        marginTop: 8,
        fontSize: 14,
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    accessCodeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    accessCodeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 2,
        marginBottom: 4,
    },
    accessCodeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 6,
    },
    infoSection: {
        marginBottom: 24,
    },
    visitorName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    idNumber: {
        fontSize: 16,
        color: '#94a3b8',
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    gridItem: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gridLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    gridValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    metaInfo: {
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    metaText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    hostCard: {
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        marginBottom: 24,
    },
    hostHeader: {
        fontSize: 11,
        color: '#3b82f6',
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1,
    },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hostAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hostName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    hostEmail: {
        fontSize: 13,
        color: '#94a3b8',
    },
    cancelButton: {
        marginTop: 24,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    cancelButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareButton: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    shareGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    shareButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    approveButton: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
    },
    denyButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        overflow: 'hidden',
    },
    denyButtonInner: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    denyButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
