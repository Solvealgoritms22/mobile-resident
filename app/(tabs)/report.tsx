import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/context/translation-context';

export default function ReportIncidentScreen() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const incidentTypes = [
        { id: 'maintenance', label: t('typeMaintenance'), icon: 'hammer-outline', color: '#10b981' },
        { id: 'security', label: t('typeSecurity'), icon: 'shield-outline', color: '#3b82f6' },
        { id: 'support', label: t('typeSupport'), icon: 'help-buoy-outline', color: '#8b5cf6' },
        { id: 'other', label: t('typeOther'), icon: 'ellipsis-horizontal-circle-outline', color: '#64748b' },
    ];

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
                t('reportSubmitted'),
                t('reportReceived'),
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Failed to submit report:', error);
            showToast(t('errorGeneric'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('reportService')}</Text>
                    <View style={{ width: 40 }} />
                </View>

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
                            <Text style={styles.submitText}>{t('submitting')}</Text>
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#ffffff" />
                                <Text style={styles.submitText}>{t('sendReport')}</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
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
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
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
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
