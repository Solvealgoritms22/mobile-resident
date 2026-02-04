import api from './api';

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export const visitService = {
    getStats: async () => {
        const response = await api.get('/visits/stats');
        return response.data;
    },

    getMyVisits: async (hostId: string, page: number = 1, limit: number = 10, startDate?: string, endDate?: string) => {
        const params: any = { page, limit };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get<PaginatedResponse<any>>(`/visits/my-visits/${hostId}`, { params });
        return response.data;
    },

    createVisit: async (data: any) => {
        const response = await api.post('/visits/create', data);
        return response.data;
    }
};
