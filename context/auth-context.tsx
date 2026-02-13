import { API_URL, PUSHER_KEY, PUSHER_CLUSTER } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Pusher from 'pusher-js';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    idNumber?: string;
    phone?: string;
    residentProfile?: {
        unitNumber: string;
    };
    profileImage?: string;
    pushNotificationsEnabled?: boolean;
    pushToken?: string;
    tenantId?: string;
    plan?: string;
    branding?: {
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    qrSecret?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    pusher: Pusher | null;
    tenantChannel: any | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (partialUser: Partial<User>) => Promise<void>;
    updatePushToken: (token: string) => Promise<void>;
    onDataRefresh: (callback: () => void) => () => void;
    refreshData: () => void;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const [tenantChannel, setTenantChannel] = useState<any>(null);
    const router = useRouter();
    const segments = useSegments();

    // Global Socket & Emergency Listener
    const playEmergencySound = async () => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: false,
            });

            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/alarm.mp3'),
                { shouldPlay: true, volume: 1.0 }
            );

            // Automatically unload sound after 10 seconds to avoid memory leaks
            const timeout = setTimeout(() => {
                sound.unloadAsync();
            }, 10000);

            // We could return this to a caller if we needed to clear it early
            return timeout;
        } catch (error) {
            console.error('Failed to play emergency sound:', error);
        }
    };

    useEffect(() => {
        restoreSession();
    }, []);

    // Handle route protection
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const isAuthorized = user && (user.role === 'RESIDENT' || user.role === 'ADMIN');

        if (!user && inAuthGroup) {
            router.replace('/login');
        } else if (user && !isAuthorized) {
            // Log out and redirect if role is invalid for this app
            logout();
        } else if (user && !inAuthGroup && isAuthorized) {
            router.replace('/(tabs)');
        }

        if (user && !isLoading && Platform.OS !== 'web') {
            registerForPushNotificationsAsync().then(token => {
                if (token) updatePushToken(token);
            });
        }
    }, [user, segments, isLoading]);

    // Global Real-time (Pusher) Listener
    useEffect(() => {
        if (!user || !token) {
            if (pusher) {
                pusher.disconnect();
                setPusher(null);
                setTenantChannel(null);
            }
            return;
        }

        console.log('Initializing Pusher for tenant:', user.tenantId);

        const pusherClient = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
            authEndpoint: `${API_URL}/pusher/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-tenant-id': user.tenantId,
                },
            },
        });

        setPusher(pusherClient);

        if (user.tenantId) {
            // Subscribe to visits channel
            const visitsChannelName = `private-tenant-${user.tenantId}-visits`;
            const visitsChannel = pusherClient.subscribe(visitsChannelName);
            setTenantChannel(visitsChannel);

            visitsChannel.bind('visitUpdate', (visit: any) => {
                console.log('Visit Update Received via Pusher:', visit);
                refreshData();
                if (visit.hostId === user.id) {
                    if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    const status = visit.status?.replace('_', ' ');
                    Alert.alert(
                        'Visit Update',
                        `Visitor ${visit.visitorName} is now ${status}`,
                        [{ text: 'OK', style: 'default' }]
                    );
                }
            });

            visitsChannel.bind('emergencyAlert', (alert: any) => {
                console.log('Emergency Alert Received via Pusher:', alert);
                const senderRole = alert.sender?.role;
                if (senderRole === 'SECURITY' || senderRole === 'ADMIN') {
                    playEmergencySound();
                    if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }

                    Alert.alert(
                        'SECURITY ALERT ⚠️',
                        `${alert.type?.toUpperCase()?.replace('_', ' ')}\n${alert.location ? `Location: ${alert.location}` : ''}\nDetailed instructions will follow.`,
                        [{ text: 'I UNDERSTAND', style: 'cancel' }],
                        { cancelable: false }
                    );
                }
            });

            // Subscribe to status channel
            const statusChannelName = `private-tenant-${user.tenantId}-status`;
            const statusChannel = pusherClient.subscribe(statusChannelName);

            statusChannel.bind('statusUpdate', (data: any) => {
                console.log('Status update received via Pusher:', data);
                if (data.type === 'USER_UPDATED' && data.user && data.user.id === user.id) {
                    console.log('Current user updated! Refreshing session...');
                    updateUser(data.user);
                }
                refreshData();
            });
        }

        // Push Notification Listeners (Native Only)
        let notificationListener: any;
        let responseListener: any;

        if (Platform.OS !== 'web') {
            notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification Received:', notification);
            });

            responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification Response:', response);
            });
        }

        return () => {
            pusherClient.disconnect();
            setPusher(null);
            setTenantChannel(null);
            if (notificationListener) notificationListener.remove();
            if (responseListener) responseListener.remove();
        };
    }, [user, token]);

    // Data Refresh Mechanism
    const refreshCallbacks = React.useRef<(() => void)[]>([]);

    const onDataRefresh = React.useCallback((callback: () => void) => {
        refreshCallbacks.current.push(callback);
        return () => {
            refreshCallbacks.current = refreshCallbacks.current.filter(cb => cb !== callback);
        };
    }, []);

    const refreshTimeoutRef = React.useRef<any>(null);
    const refreshData = React.useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            console.log('Triggering global data refresh (debounced)...');
            refreshCallbacks.current.forEach(cb => {
                try {
                    cb();
                } catch (e) {
                    console.error('Error in refresh callback:', e);
                }
            });
            refreshTimeoutRef.current = null;
        }, 500); // Wait 500ms for other events before refreshing
    }, []);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            // Use project ID from app.json/Constants
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push Token:', token);
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    }

    const restoreSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('user');
            const storedTenantId = await AsyncStorage.getItem('tenantId');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Set default headers
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                if (storedTenantId) {
                    axios.defaults.headers.common['x-tenant-id'] = storedTenantId;
                }
            }
        } catch (error) {
            console.error('Failed to restore session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = React.useCallback(async (email: string, password: string) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { access_token, user: userData, tenant } = response.data;

            // Role-based validation for Resident App
            if (userData.role !== 'RESIDENT' && userData.role !== 'ADMIN') {
                throw { response: { data: { message: 'Access Denied: Resident account required for this app.' } } };
            }

            // Merge tenant info into user object
            const extendedUser = {
                ...userData,
                tenantId: tenant?.id,
                plan: tenant?.plan || 'starter',
                branding: tenant?.branding,
                qrSecret: userData.qrSecret
            };

            // Store token and user data
            await AsyncStorage.setItem('authToken', access_token);
            await AsyncStorage.setItem('user', JSON.stringify(extendedUser));
            if (tenant?.id) {
                await AsyncStorage.setItem('tenantId', tenant.id);
            }

            setToken(access_token);
            setUser(extendedUser);

            // Set default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            if (tenant?.id) {
                axios.defaults.headers.common['x-tenant-id'] = tenant.id;
            }

            router.replace('/(tabs)');
        } catch (error) {
            throw error;
        }
    }, [router]);

    const logout = React.useCallback(async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');

            setToken(null);
            setUser(null);

            // Remove Authorization header
            delete axios.defaults.headers.common['Authorization'];

            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [router]);

    const updateUser = React.useCallback(async (partialUser: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...partialUser };
        setUser(updated);
        try {
            await AsyncStorage.setItem('user', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to persist user update:', error);
        }
    }, [user]);

    const updatePushToken = React.useCallback(async (pushToken: string) => {
        if (!user || user.pushToken === pushToken) return;
        try {
            await axios.patch(`${API_URL}/users/${user.id}/push-settings`, { pushToken });
            await updateUser({ pushToken });
        } catch (error) {
            console.error('Failed to update push token on backend:', error);
        }
    }, [user, updateUser]);

    const value = React.useMemo(() => ({
        user,
        token,
        isLoading,
        pusher,
        tenantChannel,
        login,
        logout,
        updateUser,
        updatePushToken,
        onDataRefresh,
        refreshData
    }), [user, token, isLoading, socket, login, logout, updateUser, updatePushToken, onDataRefresh, refreshData]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
