import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface FeedbackByStatusChartProps {
    data: ChartData[];
}

export const FeedbackByStatusChart: React.FC<FeedbackByStatusChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 p-4">No hay datos para mostrar.</div>;
    }

    const total = data.reduce((acc, item) => acc + item.value, 0);
    const circumference = 2 * Math.PI * 40; // Circle radius is 40
    let offset = 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback por Estado</h3>
            <div className="relative w-40 h-40 mx-auto my-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Rotate the whole thing -90deg to start from the top */}
                    <g transform="rotate(-90, 50, 50)">
                        {data.map((item, index) => {
                            const percent = total > 0 ? item.value / total : 0;
                            const dasharray = `${percent * circumference} ${circumference}`;
                            const strokeOffset = -offset;
                            offset += percent * circumference;
                            
                            return (
                                <circle
                                    key={index}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="20"
                                    strokeDasharray={dasharray}
                                    strokeDashoffset={strokeOffset}
                                />
                            );
                        })}
                    </g>
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{total}</span>
                </div>
            </div>
            <div className="mt-auto">
                <ul className="text-sm text-gray-600 space-y-1">
                     {data.map(item => (
                        <li key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                <span>{item.label}</span>
                            </div>
                            <strong>{item.value}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};