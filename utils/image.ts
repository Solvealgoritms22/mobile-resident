import { API_URL } from '@/constants/api';

export const getImageUrl = (path?: string, bustCache = false) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Normalize path: replace backslashes (Windows) with forward slashes
    let normalizedPath = path.replace(/\\/g, '/');

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
    }

    let url = `${baseUrl}${normalizedPath}`;
    if (bustCache) {
        url += (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
    }
    return url;
};

export const getInitials = (name?: string) => {
    if (!name) return 'R';
    try {
        return name.split(' ')
            .filter(part => part.length > 0)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'R';
    } catch (e) {
        return 'R';
    }
};
