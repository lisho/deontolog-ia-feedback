import React, { useMemo } from 'react';
import type { FeedbackData } from '../types.ts';
import { KpiCard } from './KpiCard.tsx';
import { FeedbackByTypeChart } from './charts/FeedbackByTypeChart.tsx';
import { FeedbackByStatusChart } from './charts/FeedbackByStatusChart.tsx';

interface DashboardViewProps {
    feedbackList: FeedbackData[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ feedbackList }) => {
    
    const stats = useMemo(() => {
        const total = feedbackList.length;
        const pending = feedbackList.filter(fb => fb.review_status === 'Pendiente').length;
        
        const ratedFeedback = feedbackList.filter(fb => fb.valoracion_deontologica > 0);
        const avgRating = ratedFeedback.length > 0
            ? (ratedFeedback.reduce((acc, fb) => acc + fb.valoracion_deontologica, 0) / ratedFeedback.length)
            : 0;

        const feedbackByType = feedbackList.reduce((acc, fb) => {
            const type = fb.tipo_feedback || 'Sin tipo';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const feedbackByStatus = feedbackList.reduce((acc, fb) => {
            const status = fb.review_status || 'Sin estado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            pending,
            avgRating: avgRating.toFixed(2),
            byType: Object.entries(feedbackByType)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value),
            byStatus: Object.entries(feedbackByStatus)
                .map(([label, value]) => ({ label, value })),
        };
    }, [feedbackList]);

    const statusChartData = useMemo(() => {
        const statusColors: Record<string, string> = {
            'Pendiente': '#F59E0B', // amber-500
            'En Revisión': '#3B82F6', // blue-500
            'Revisado': '#10B981', // emerald-500
        };
        return stats.byStatus.map(item => ({
            ...item,
            color: statusColors[item.label] || '#6B7280' // gray-500
        }));
    }, [stats.byStatus]);

    return (
        <div className="mt-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Estadísticas y Métricas Clave</h3>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <KpiCard 
                    title="Total de Feedbacks"
                    value={stats.total}
                    description="Número total de registros recibidos."
                />
                <KpiCard 
                    title="Pendientes de Revisión"
                    value={stats.pending}
                    description={`${stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(0) : 0}% del total.`}
                />
                <KpiCard 
                    title="Valoración Media"
                    value={`${stats.avgRating} ★`}
                    description="Promedio de la valoración deontológica."
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FeedbackByTypeChart data={stats.byType} />
                <FeedbackByStatusChart data={statusChartData} />
            </div>
        </div>
    );
};