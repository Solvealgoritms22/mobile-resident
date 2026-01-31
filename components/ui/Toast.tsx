import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
    const translateY = new Animated.Value(-100);

    useEffect(() => {
        Animated.sequence([
            Animated.spring(translateY, {
                toValue: 20,
                useNativeDriver: true,
            }),
            Animated.delay(3000),
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, []);

    const getConfig = () => {
        switch (type) {
            case 'success': return { icon: 'checkmark-circle', color: '#10b981' };
            case 'error': return { icon: 'alert-circle', color: '#ef4444' };
            default: return { icon: 'information-circle', color: '#3b82f6' };
        }
    };

    const config = getConfig();

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
            <BlurView intensity={80} tint="dark" style={styles.blur}>
                <View style={[styles.indicator, { backgroundColor: config.color }]} />
                <Ionicons name={config.icon as any} size={24} color={config.color} style={styles.toastIcon} />
                <Text style={styles.toastText}>{message}</Text>
            </BlurView>
        </Animated.View>
    );
};

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 16,
        overflow: 'hidden',
    },
    blur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 20,
    },
    indicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
    },
    toastIcon: {
        marginRight: 12,
    },
    toastText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
