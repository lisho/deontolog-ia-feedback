import React, { useMemo } from 'react';
import type { FeedbackData } from '../types.ts';
import { KpiCard } from './KpiCard.tsx';
import { FeedbackByTypeChart } from './charts/FeedbackByTypeChart.tsx';
import { FeedbackByStatusChart } from './charts/FeedbackByStatusChart.tsx';
import { ClarityUtilityChart } from './charts/ClarityUtilityChart.tsx';
import { RatingDistributionChart } from './charts/RatingDistributionChart.tsx';

interface DashboardViewProps {
    feedbackList: FeedbackData[];
}

// FIX: Define a more specific type for rating keys to ensure type safety.
type RatingKeys = 'valoracion_deontologica' | 'valoracion_pertinencia' | 'valoracion_calidad_interaccion';

export const DashboardView: React.FC<DashboardViewProps> = ({ feedbackList }) => {
    
    const stats = useMemo(() => {
        const total = feedbackList.length;
        const pending = feedbackList.filter(fb => fb.review_status === 'Pendiente').length;
        
        const ratedFeedback = feedbackList.filter(fb => fb.valoracion_deontologica > 0);
        const avgRating = ratedFeedback.length > 0
            ? (ratedFeedback.reduce((acc, fb) => acc + fb.valoracion_deontologica, 0) / ratedFeedback.length)
            : 0;

        // Fix: Explicitly type accumulator in reduce to avoid 'any' type inference.
        const feedbackByType = feedbackList.reduce((acc: Record<string, number>, fb) => {
            const type = fb.tipo_feedback || 'Sin tipo';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        // Fix: Correctly type the initial value for `reduce` to ensure proper type inference for the result.
        }, {} as Record<string, number>);

        // Fix: Explicitly type accumulator in reduce to avoid 'any' type inference.
        const feedbackByStatus = feedbackList.reduce((acc: Record<string, number>, fb) => {
            const status = fb.review_status || 'Sin estado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        // Fix: Correctly type the initial value for `reduce` to ensure proper type inference for the result.
        }, {} as Record<string, number>);

        // Stats for "Valorar Conversación"
        const conversationFeedback = feedbackList.filter(fb => fb.tipo_feedback === 'Valorar Conversación');

        // Fix: Explicitly type accumulator in reduce to avoid 'any' type inference.
        const clarityData = conversationFeedback.reduce((acc: Record<string, number>, fb) => {
            if (fb.claridad === 'Sí' || fb.claridad === 'No') {
                acc[fb.claridad] = (acc[fb.claridad] || 0) + 1;
            }
            return acc;
        // Fix: Correctly type the initial value for `reduce` to ensure proper type inference for the result.
        }, {} as Record<string, number>);

        // Fix: Explicitly type accumulator in reduce to avoid 'any' type inference.
        const utilityData = conversationFeedback.reduce((acc: Record<string, number>, fb) => {
             if (fb.utilidad === 'Sí' || fb.utilidad === 'No' || fb.utilidad === 'No Estoy Seguro') {
                acc[fb.utilidad] = (acc[fb.utilidad] || 0) + 1;
            }
            return acc;
        // Fix: Correctly type the initial value for `reduce` to ensure proper type inference for the result.
        }, {} as Record<string, number>);

        const getRatingDistribution = (fieldName: RatingKeys) => {
            // Fix: Explicitly type accumulator in reduce to avoid 'any' type inference.
            const distribution = conversationFeedback
                .filter(fb => typeof fb[fieldName] === 'number' && (fb[fieldName] as number) > 0)
                .reduce((acc: Record<number, number>, fb) => {
                    const rating = fb[fieldName] as number;
                    acc[rating] = (acc[rating] || 0) + 1;
                    return acc;
                // Fix: Correctly type the initial value for `reduce` to ensure proper type inference for the result.
                }, {} as Record<number, number>);
            
            return Array.from({ length: 5 }, (_, i) => 5 - i).map(rating => ({
                rating: `${rating} ★`,
                count: distribution[rating] || 0
            }));
        };

        return {
            total,
            pending,
            avgRating: avgRating.toFixed(2),
            byType: Object.entries(feedbackByType)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value),
            byStatus: Object.entries(feedbackByStatus)
                .map(([label, value]) => ({ label, value })),
            clarity: Object.entries(clarityData).map(([label, value]) => ({ label, value })),
            utility: Object.entries(utilityData).map(([label, value]) => ({ label, value })),
            deontologicalRatingDist: getRatingDistribution('valoracion_deontologica'),
            pertinenceRatingDist: getRatingDistribution('valoracion_pertinencia'),
            interactionQualityRatingDist: getRatingDistribution('valoracion_calidad_interaccion'),
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
                    title="Valoración Media (Deont.)"
                    value={`${stats.avgRating} ★`}
                    description="Promedio de la valoración deontológica."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FeedbackByTypeChart data={stats.byType} />
                <FeedbackByStatusChart data={statusChartData} />
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Métricas de Conversación</h3>
                <div className="grid grid-cols-1 gap-6 mt-4">
                    <ClarityUtilityChart clarityData={stats.clarity} utilityData={stats.utility} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <RatingDistributionChart 
                        data={stats.deontologicalRatingDist}
                        title="Valoración Deontológica"
                        color="#F59E0B"
                    />
                    <RatingDistributionChart 
                        data={stats.pertinenceRatingDist}
                        title="Pertinencia de Respuestas"
                        color="#8B5CF6"
                    />
                    <RatingDistributionChart 
                        data={stats.interactionQualityRatingDist}
                        title="Calidad de Interacción"
                        color="#EC4899"
                    />
                </div>
            </div>
        </div>
    );
};
