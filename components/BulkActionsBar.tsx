import React, { useState } from 'react';
import type { ReviewStatus } from '../types.ts';

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkDelete: () => void;
    onBulkUpdateStatus: (status: ReviewStatus) => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onClearSelection, onBulkDelete, onBulkUpdateStatus }) => {
    const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('Pendiente');

    const handleUpdateClick = () => {
        if (selectedStatus) {
            onBulkUpdateStatus(selectedStatus);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm sticky top-2 z-10">
            <div className="flex items-center gap-4">
                <span className="font-semibold text-blue-800">{selectedCount} {selectedCount > 1 ? 'elementos seleccionados' : 'elemento seleccionado'}</span>
                <button onClick={onClearSelection} className="text-sm text-blue-600 hover:underline">
                    Limpiar selección
                </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus)}
                        className="rounded-md border-gray-300 shadow-sm p-2 text-sm bg-white text-black focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Nuevo estado para la selección"
                    >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Revisión">En Revisión</option>
                        <option value="Revisado">Revisado</option>
                    </select>
                    <button
                        onClick={handleUpdateClick}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                        Actualizar Estado
                    </button>
                </div>
                <button
                    onClick={onBulkDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                    Borrar Selección
                </button>
            </div>
        </div>
    );
};