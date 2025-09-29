import React from 'react';
import type { FeedbackData } from '../types.ts';

interface ExportButtonProps {
    data: FeedbackData[];
}

const formatCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const str = String(field);
    // Escape quotes and wrap in quotes if necessary
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return str;
};

const convertToCsv = (data: FeedbackData[]): string => {
    if (data.length === 0) return '';
    
    // Use the keys from the first object as headers, ensuring consistency and order
    const headers: (keyof FeedbackData)[] = [
        'id', 'nombre_evaluador', 'fecha_hora', 'timestamp', 'dispositivo', 'escenario_keywords', 
        'tipo_feedback', 'descripcion', 'respuesta_chatbot', 'claridad', 'utilidad',
        'valoracion_deontologica', 'comentarios_finales', 'review_status', 'review_result'
    ];
    
    const headerRow = headers.map(formatCsvField).join(',');

    const dataRows = data.map(row => {
        return headers.map(header => {
            return formatCsvField(row[header]);
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
};

const downloadCsv = (csvString: string, filename: string) => {
    // Add BOM for Excel to recognize UTF-8 characters correctly
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {

    const handleExport = () => {
        if (data.length === 0) {
            // This case is handled by the disabled prop, but as a safeguard.
            return;
        }

        const csvString = convertToCsv(data);
        const date = new Date().toISOString().slice(0, 10);
        const filename = `feedback-export-${date}.csv`;
        downloadCsv(csvString, filename);
    };

    return (
        <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="Exportar datos filtrados a CSV"
        >
            Exportar a CSV
        </button>
    );
};
