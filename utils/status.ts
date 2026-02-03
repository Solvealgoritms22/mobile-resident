export const getStatusConfig = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'CHECKED_IN' || s === 'APPROVED') return { icon: 'checkmark', color: '#10b981' };
    if (s === 'CHECKED_OUT') return { icon: 'log-out', color: '#3b82f6' };
    if (s === 'PENDING') return { icon: 'time-outline', color: '#f59e0b' };
    if (s === 'FLAGGED') return { icon: 'flag', color: '#ef4444' };
    return { icon: 'close', color: '#ef4444' };
};

export const getStatusColor = (status: string) => {
    return getStatusConfig(status).color;
};
