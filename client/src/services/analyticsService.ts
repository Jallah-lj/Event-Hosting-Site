import api from './api';

export interface AnalyticsData {
    stats: {
        revenue: number;
        ticketsSold: number;
        checkInRate: number;
    };
    chartData: {
        time: string;
        sales: number;
        checkIns: number;
        activeUsers: number;
    }[];
    recentActivity: {
        id: string;
        type: string;
        timestamp: string;
        eventTitle: string;
        attendee: string;
    }[];
}

export const analyticsService = {
    async getLiveStats(): Promise<AnalyticsData> {
        const response = await api.get<AnalyticsData>('/analytics/organizer/live');
        return response.data;
    }
};

export default analyticsService;
