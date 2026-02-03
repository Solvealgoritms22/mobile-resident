import { API_URL } from '@/constants/api';

export const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Normalize path: replace backslashes (Windows) with forward slashes
    let normalizedPath = path.replace(/\\/g, '/');

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
    }

    return `${baseUrl}${normalizedPath}`;
};

export const getInitials = (name: string) => {
    return name?.split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'U';
};
