import React from 'react';

interface ChartData {
    rating: string;
    count: number;
}

interface RatingDistributionChartProps {
    data: ChartData[];
    title: string;
    color: string;
}

export const RatingDistributionChart: React.FC<RatingDistributionChartProps> = ({ data, title, color }) => {
    const hasData = data && data.some(d => d.count > 0);
    
    if (!hasData) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="text-center text-gray-500 p-4 h-full flex items-center justify-center">No hay valoraciones para mostrar.</div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.count), 0);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.rating}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-700">{item.rating}</span>
                            <span className="font-semibold text-gray-800">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full"
                                style={{
                                    width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%`,
                                    backgroundColor: color
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};