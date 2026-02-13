import { Platform } from 'react-native';

// API URL configuration based on platform
// - Web/Simulator: uses localhost
// - Android Emulator: uses 10.0.2.2
// - Physical Device: Uses the deployed Render backend
export const API_URL = Platform.select({
    web: 'https://backend-cosevi.vercel.app/api',
    android: 'https://backend-cosevi.vercel.app/api',
    ios: 'https://backend-cosevi.vercel.app/api',
    default: 'https://backend-cosevi.vercel.app/api',
});

export const PUSHER_KEY = '8910086b955700fc2641';
export const PUSHER_CLUSTER = 'us2';
