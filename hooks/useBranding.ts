import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useBranding() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';

    // Default brand colors
    const defaultPrimary = '#4f46e5'; // Indigo 600
    const defaultSecondary = '#1e293b'; // Slate 800

    // Only apply branding if user is on ELITE plan
    const isElite = user?.plan === 'elite';

    const branding = {
        primary: isElite && user?.branding?.primaryColor ? user.branding.primaryColor : defaultPrimary,
        secondary: isElite && user?.branding?.secondaryColor ? user.branding.secondaryColor : defaultSecondary,
        logo: isElite ? user?.branding?.logo : null,
        isElite
    };

    return branding;
}
