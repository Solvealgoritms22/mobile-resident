import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function SubscriptionWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    if (!user || user.subscriptionStatus === 'ACTIVE') {
        return <>{children}</>;
    }

    if (user.subscriptionStatus === 'CANCELLED') {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.card}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
                    <ThemedText type="title" style={styles.title}>Servicio Suspendido</ThemedText>
                    <ThemedText style={styles.description}>
                        La suscripción de tu comunidad ha sido cancelada o suspendida. Por favor, contacta a la administración para restablecer el acceso.
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {user.subscriptionStatus === 'PAST_DUE' && (
                <View style={styles.warningBar}>
                    <ThemedText style={styles.warningText}>⚠️ Pago Pendiente - Modo solo lectura</ThemedText>
                </View>
            )}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
        width: '100%',
    },
    title: {
        marginTop: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        opacity: 0.6,
        lineHeight: 20,
    },
    warningBar: {
        backgroundColor: '#f59e0b',
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        zIndex: 100,
    },
    warningText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});
