import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useBranding } from '@/hooks/useBranding';
import { useTranslation } from '@/context/translation-context';

export default function HardwareMonitorScreen() {
    const { user } = useAuth();
    const { primary, isElite } = useBranding();
    const { t } = useTranslation();
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const resp = await axios.get(`${API_URL}/hardware/events`);
            setEvents(resp.data);
        } catch (error) {
            console.error('Failed to fetch hardware events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isElite) {
            fetchEvents();
        }
    }, [isElite]);

    if (!isElite) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Access Denied: Elite Plan Required</Text>
            </View>
        );
    }

    const renderEvent = ({ item }: { item: any }) => (
        <View style={styles.eventCard}>
            <View style={[styles.iconContainer, { backgroundColor: primary + '20' }]}>
                <Ionicons
                    name={item.type === 'PLATE_READ' ? 'camera' : 'hardware-chip'}
                    size={24}
                    color={primary}
                />
            </View>
            <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.device?.name || 'Unknown Device'}</Text>
                <Text style={styles.eventType}>{item.type}</Text>
                {item.data && (
                    <Text style={styles.eventData}>
                        {JSON.stringify(item.data)}
                    </Text>
                )}
            </View>
            <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: t('hardwareMonitor') || 'Hardware Monitor',
                    headerStyle: { backgroundColor: '#0f172a' },
                    headerTintColor: '#fff',
                }}
            />

            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={primary} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.subtitle}>Real-time Hardware Integration Status</Text>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? null : <Text style={styles.emptyText}>No events recorded yet.</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    list: {
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventType: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 2,
    },
    eventData: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    timestamp: {
        color: '#64748b',
        fontSize: 10,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    emptyText: {
        color: '#475569',
        textAlign: 'center',
        marginTop: 40,
    }
});
