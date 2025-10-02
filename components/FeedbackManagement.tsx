import React, { useState, useEffect } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { FeedbackManagementRow } from './FeedbackManagementRow.tsx';
import { PaginationControls } from './PaginationControls.tsx';
import { ExportButton } from './ExportButton.tsx';
import { BulkActionsBar } from './BulkActionsBar.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface FeedbackManagementProps {
    feedbackList: FeedbackData[];
    isLoading: boolean;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

export const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ feedbackList, isLoading, onUpdateReview, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]); // Reset selection when filters or data change
    }, [feedbackList]);
    
    const totalPages = Math.ceil(feedbackList.length / ITEMS_PER_PAGE);
    const paginatedFeedback = feedbackList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const currentVisibleIds = paginatedFeedback.map(fb => fb.id).filter(Boolean) as string[];

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === currentVisibleIds.length) {
            setSelectedIds([]); // Deselect all if all are selected
        } else {
            setSelectedIds(currentVisibleIds); // Select all visible
        }
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const handleBulkUpdateStatus = async (status: ReviewStatus) => {
        const feedbackToUpdate = feedbackList.filter(fb => fb.id && selectedIds.includes(fb.id));
        await Promise.all(
            feedbackToUpdate.map(fb => onUpdateReview(fb.id!, status, fb.review_result))
        );
        setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        await Promise.all(selectedIds.map(id => onDelete(id)));
        setIsConfirmingBulkDelete(false);
        setSelectedIds([]);
    };


    return (
        <div className="mt-6 mb-6">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Gestión de Feedback</h3>
                {feedbackList.length > 0 && (
                    <ExportButton data={feedbackList} />
                )}
            </div>
            {isLoading ? (
                <div className="text-center text-gray-500 p-4">Cargando datos...</div>
            ) : feedbackList.length === 0 ? (
                <div className="text-center text-gray-500 p-4">Aún no hay feedback registrado.</div>
            ) : (
                <>
                    {selectedIds.length > 0 && (
                        <BulkActionsBar
                            selectedCount={selectedIds.length}
                            onClearSelection={handleClearSelection}
                            onBulkDelete={() => setIsConfirmingBulkDelete(true)}
                            onBulkUpdateStatus={handleBulkUpdateStatus}
                        />
                    )}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            checked={currentVisibleIds.length > 0 && selectedIds.length === currentVisibleIds.length}
                                            ref={el => {
                                                if (el) {
                                                    el.indeterminate = selectedIds.length > 0 && selectedIds.length < currentVisibleIds.length;
                                                }
                                            }}
                                            onChange={handleToggleSelectAll}
                                            aria-label="Seleccionar todo en esta página"
                                        />
                                    </th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Escenario</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Valoración</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {paginatedFeedback.map((feedback) => (
                                    <FeedbackManagementRow
                                        key={feedback.id}
                                        feedback={feedback}
                                        onUpdateReview={onUpdateReview}
                                        onDelete={onDelete}
                                        isSelected={!!feedback.id && selectedIds.includes(feedback.id)}
                                        onToggleSelect={handleToggleSelect}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
            <ConfirmationModal
                isOpen={isConfirmingBulkDelete}
                onClose={() => setIsConfirmingBulkDelete(false)}
                onConfirm={handleBulkDelete}
                title={`Confirmar Borrado de ${selectedIds.length} Elementos`}
                message="¿Estás seguro de que quieres borrar los registros de feedback seleccionados? Esta acción no se puede deshacer."
                confirmText="Sí, Borrar Selección"
            />
        </div>
    );
};