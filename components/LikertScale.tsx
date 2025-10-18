import React from 'react';

interface LikertScaleProps {
    value: number;
    onChange: (value: number) => void;
    idPrefix: string;
}

const scalePoints = [1, 2, 3, 4, 5];
const scaleLabels: Record<number, string> = {
    1: 'Totalmente en Desacuerdo',
    3: 'Neutral',
    5: 'Totalmente de Acuerdo'
};

export const LikertScale: React.FC<LikertScaleProps> = ({ value, onChange, idPrefix }) => {
    return (
        <div className="flex justify-between items-center mt-2 flex-wrap -mx-2">
            {scalePoints.map(point => (
                <div key={point} className="flex flex-col items-center flex-1 min-w-[100px] my-2 px-2">
                    <label htmlFor={`${idPrefix}-${point}`} className="text-xs text-gray-600 mb-1 text-center h-8 flex items-center justify-center">
                        {scaleLabels[point] || ''}
                    </label>
                    <input
                        type="radio"
                        id={`${idPrefix}-${point}`}
                        name={idPrefix}
                        value={point}
                        checked={value === point}
                        onChange={() => onChange(point)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ))}
        </div>
    );
};
