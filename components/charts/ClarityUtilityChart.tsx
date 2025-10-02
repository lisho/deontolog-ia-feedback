import React from 'react';

interface ChartData {
    label: string;
    value: number;
}

interface ClarityUtilityChartProps {
    clarityData: ChartData[];
    utilityData: ChartData[];
}

const BarGroup: React.FC<{ title: string, data: ChartData[], color: string }> = ({ title, data, color }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0);
    return (
        <div>
            <h4 className="font-semibold text-gray-700 mb-2">{title}</h4>
             <div className="space-y-2">
                {data.map((item) => (
                    <div key={item.label}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-600">{item.label}</span>
                            <span className="font-semibold text-gray-700">{item.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full"
                                style={{
                                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                    backgroundColor: color
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const ClarityUtilityChart: React.FC<ClarityUtilityChartProps> = ({ clarityData, utilityData }) => {
    const hasClarityData = clarityData && clarityData.length > 0;
    const hasUtilityData = utilityData && utilityData.length > 0;

    if (!hasClarityData && !hasUtilityData) {
        return (
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Claridad y Utilidad</h3>
                <div className="text-center text-gray-500 p-4 h-full flex items-center justify-center">No hay datos para mostrar.</div>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Claridad y Utilidad de Respuestas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasClarityData ? <BarGroup title="Claridad" data={clarityData} color="#3B82F6" /> : <div><h4 className="font-semibold text-gray-700 mb-2">Claridad</h4><p className="text-sm text-gray-500">Sin datos</p></div>}
                {hasUtilityData ? <BarGroup title="Utilidad" data={utilityData} color="#10B981" /> : <div><h4 className="font-semibold text-gray-700 mb-2">Utilidad</h4><p className="text-sm text-gray-500">Sin datos</p></div>}
            </div>
        </div>
    );
};