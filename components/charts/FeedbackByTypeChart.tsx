import React from 'react';

interface ChartData {
    label: string;
    value: number;
}

interface FeedbackByTypeChartProps {
    data: ChartData[];
    title?: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#D946EF'];

export const FeedbackByTypeChart: React.FC<FeedbackByTypeChartProps> = ({ data, title = 'Feedback por Tipo' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="text-center text-gray-500 p-4 h-full flex items-center justify-center">No hay datos para mostrar.</div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value), 0);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={item.label}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-700">{item.label}</span>
                            <span className="font-semibold text-gray-800">{item.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full"
                                style={{
                                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};