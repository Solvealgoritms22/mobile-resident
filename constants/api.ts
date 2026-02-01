import { Platform } from 'react-native';

// API URL configuration based on platform
// - Web/Simulator: uses localhost
// - Android Emulator: uses 10.0.2.2
// - Physical Device: Uses the deployed Render backend
export const API_URL = Platform.select({
    web: 'https://backend-cosevi.onrender.com',
    android: 'https://backend-cosevi.onrender.com',
    ios: 'https://backend-cosevi.onrender.com',
    default: 'https://backend-cosevi.onrender.com',
});
